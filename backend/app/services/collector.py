import logging
import re
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session

from app.config import settings
from app.models.collection_log import CollectionLog
from app.models.property import Property
from app.models.review import Review
from app.services.classifier import (
    classify_sentiment,
    classify_topics,
    compute_review_dedup_hash,
)
from app.services.seed_sample import seed_sample_reviews

logger = logging.getLogger(__name__)

CHALLENGE_OR_BLOCK_MARKERS = [
    "verify you are human",
    "captcha",
    "challenge-platform",
    "access denied",
    "bot detection",
    "awswaf",
    "cloudflare",
    "are you a robot",
]


def _detect_challenge_or_block(html_text: str, status_code: Optional[int]) -> Optional[str]:
    """
    Detect whether a public page request hit an anti-bot challenge, CAPTCHA, or access wall.
    We strictly do NOT bypass any challenge or restriction; we halt and document it.
    """
    if status_code in (401, 403, 429, 503):
        return f"HTTP {status_code} access restriction or rate limit"
    lowered = (html_text or "").lower()
    for marker in CHALLENGE_OR_BLOCK_MARKERS:
        if marker in lowered and "bui-review" not in lowered and "review_list_new_item_block" not in lowered:
            return f"Anti-bot or CAPTCHA gate encountered ({marker}); collection halted per compliance policy"
    return None


def _parse_review_date(raw_date_str: Optional[str]) -> date:
    """Parse common Booking.com public review date formats with safe fallback to today."""
    if not raw_date_str:
        return datetime.now(timezone.utc).date()
    cleaned = re.sub(r"^(Reviewed:|Reviewed on)\s*", "", raw_date_str.strip(), flags=re.I)
    for fmt in ("%d %B %Y", "%B %d, %Y", "%Y-%m-%d", "%d %b %Y"):
        try:
            return datetime.strptime(cleaned, fmt).date()
        except ValueError:
            continue
    return datetime.now(timezone.utc).date()


def _parse_public_reviews_from_html(html_content: str) -> List[Dict[str, Any]]:
    """
    Extract publicly rendered review cards from a Booking.com property/reviews HTML document.
    Handles missing fields and multiple DOM selector conventions gracefully.
    """
    soup = BeautifulSoup(html_content, "html.parser")
    cards = soup.select(
        '[data-testid="review-card"], .review_list_new_item_block, .c-review-block'
    )
    extracted: List[Dict[str, Any]] = []

    for card in cards:
        ext_id = card.get("data-review-url") or card.get("id")
        name_el = card.select_one(
            '[data-testid="review-avatar"] div, .bui-avatar-block__title'
        )
        country_el = card.select_one(
            '[data-testid="review-avatar"] span, .bui-avatar-block__subtitle'
        )
        score_el = card.select_one(
            '[data-testid="review-score"] div, .bui-review-score__badge'
        )
        title_el = card.select_one(
            '[data-testid="review-title"], .c-review-block__title'
        )
        pos_el = card.select_one(
            '[data-testid="review-positive-text"], .c-review__row:not(.sustained) .c-review__body'
        )
        neg_el = card.select_one(
            '[data-testid="review-negative-text"], .c-review__row.sustained .c-review__body'
        )
        date_el = card.select_one(
            '[data-testid="review-date"], .c-review-block__date'
        )
        room_el = card.select_one(
            '[data-testid="review-room-name"], .c-review-block__room-info-row'
        )
        stay_el = card.select_one(
            '[data-testid="review-num-nights"], .c-review-block__stay-date'
        )

        raw_score = score_el.get_text(strip=True) if score_el else ""
        score_match = re.search(r"(\d+(?:[.,]\d+)?)", raw_score)
        if not score_match:
            continue
        rating = float(score_match.group(1).replace(",", "."))
        rating = max(0.0, min(10.0, rating))

        reviewer_name = (
            name_el.get_text(strip=True) if name_el else "Booking.com Guest"
        )
        title = title_el.get_text(strip=True) if title_el else None
        pos_text = pos_el.get_text(strip=True) if pos_el else None
        neg_text = neg_el.get_text(strip=True) if neg_el else None

        if not any([title, pos_text, neg_text]):
            continue

        extracted.append(
            {
                "external_review_id": ext_id,
                "reviewer_name": reviewer_name,
                "reviewer_country": country_el.get_text(strip=True) if country_el else None,
                "room_type": room_el.get_text(strip=True) if room_el else None,
                "stay_duration": stay_el.get_text(strip=True) if stay_el else None,
                "review_date": _parse_review_date(
                    date_el.get_text(strip=True) if date_el else None
                ),
                "rating": rating,
                "title": title,
                "positive_text": pos_text,
                "negative_text": neg_text,
            }
        )

    return extracted


def collect_public_reviews_for_property(
    db: Session,
    prop: Property,
    use_sample_fallback_on_empty_or_block: bool = True,
) -> CollectionLog:
    """
    Attempt permitted public-page review collection for a single property using Playwright.
    - Never bypasses CAPTCHA, anti-bot gates, or authentication.
    - Retries transient timeouts up to `settings.COLLECTOR_MAX_RETRIES`.
    - Deduplicates using SHA-256 `dedup_hash`.
    - Logs outcome in `collection_logs` and optionally triggers explicitly labelled sample fallback.
    """
    started_at = datetime.now(timezone.utc)
    reviews_found = 0
    reviews_inserted = 0
    reviews_duplicated = 0
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    status = "running"
    used_sample_fallback = False

    collected_raw: List[Dict[str, Any]] = []

    try:
        from playwright.sync_api import sync_playwright

        with sync_playwright() as p:
            browser = None
            for launch_kwargs in (
                {"headless": settings.COLLECTOR_HEADLESS},
                {"channel": "chrome", "headless": settings.COLLECTOR_HEADLESS},
                {"channel": "msedge", "headless": settings.COLLECTOR_HEADLESS},
            ):
                try:
                    browser = p.chromium.launch(**launch_kwargs)
                    break
                except Exception:
                    continue
            if browser is None:
                raise RuntimeError("Could not launch Playwright Chromium, Chrome, or Edge binary.")
            context = browser.new_context(
                user_agent=settings.COLLECTOR_USER_AGENT,
                locale="en-AU",
            )
            page = context.new_page()

            last_exc: Optional[Exception] = None
            for attempt in range(1, settings.COLLECTOR_MAX_RETRIES + 1):
                try:
                    response = page.goto(
                        prop.booking_url,
                        timeout=settings.COLLECTOR_TIMEOUT_MS,
                        wait_until="domcontentloaded",
                    )
                    status_code = response.status if response else None
                    html = page.content()

                    block_reason = _detect_challenge_or_block(html, status_code)
                    if block_reason:
                        error_type = "ACCESS_OR_CHALLENGE_GATE"
                        error_message = block_reason
                        status = "blocked_or_unavailable"
                        break

                    # Parse any publicly accessible reviews on the page
                    page_reviews = _parse_public_reviews_from_html(html)
                    collected_raw.extend(page_reviews)
                    break
                except Exception as nav_exc:
                    last_exc = nav_exc
                    logger.warning(
                        "Attempt %d/%d failed for %s: %s",
                        attempt,
                        settings.COLLECTOR_MAX_RETRIES,
                        prop.slug,
                        nav_exc,
                    )

            context.close()
            browser.close()

            if last_exc and not collected_raw and not error_type:
                error_type = type(last_exc).__name__
                error_message = str(last_exc)
                status = "failed"

    except Exception as outer_exc:
        error_type = type(outer_exc).__name__
        error_message = (
            f"Playwright browser initialization or collection error: {outer_exc}"
        )
        status = "failed"

    # Persist any live public reviews found
    if collected_raw:
        reviews_found = len(collected_raw)
        for item in collected_raw:
            dedup_hash = compute_review_dedup_hash(
                property_id=prop.id,
                reviewer_name=item["reviewer_name"],
                review_date=item["review_date"],
                title=item.get("title"),
                positive_text=item.get("positive_text"),
                negative_text=item.get("negative_text"),
                external_review_id=item.get("external_review_id"),
            )
            exists = db.query(Review).filter(Review.dedup_hash == dedup_hash).first()
            if exists:
                reviews_duplicated += 1
                continue

            full_text = " ".join(
                part
                for part in [
                    item.get("title"),
                    item.get("positive_text"),
                    item.get("negative_text"),
                ]
                if part
            )
            sentiment = classify_sentiment(
                rating=item["rating"],
                positive_text=item.get("positive_text"),
                negative_text=item.get("negative_text"),
                full_text=full_text,
            )
            topics, neg_topics = classify_topics(
                sentiment=sentiment,
                title=item.get("title"),
                positive_text=item.get("positive_text"),
                negative_text=item.get("negative_text"),
                full_text=full_text,
            )
            db.add(
                Review(
                    property_id=prop.id,
                    external_review_id=item.get("external_review_id"),
                    dedup_hash=dedup_hash,
                    reviewer_name=item["reviewer_name"],
                    reviewer_country=item.get("reviewer_country"),
                    room_type=item.get("room_type"),
                    stay_duration=item.get("stay_duration"),
                    stay_date=item["review_date"].strftime("%B %Y"),
                    review_date=item["review_date"],
                    rating=item["rating"],
                    title=item.get("title"),
                    positive_text=item.get("positive_text"),
                    negative_text=item.get("negative_text"),
                    full_text=full_text,
                    sentiment=sentiment,
                    topics=topics,
                    negative_topics=neg_topics,
                    is_sample_data=False,
                    data_source="booking_public",
                )
            )
            reviews_inserted += 1

        status = "success"
    else:
        if not error_type:
            error_type = "NO_PUBLIC_REVIEWS_RENDERED"
            error_message = (
                "Booking.com public property landing page did not expose inline review cards without interactive modal/challenge."
            )
            status = "blocked_or_unavailable"

        if use_sample_fallback_on_empty_or_block and settings.ENABLE_SAMPLE_FALLBACK_ON_BLOCK:
            seed_stats = seed_sample_reviews(db, property_slug=prop.slug)
            used_sample_fallback = True
            status = "sample_fallback"
            error_message = (
                f"{error_message} — Activated clearly labelled Sample Data fallback "
                f"({seed_stats['reviews_inserted']} sample reviews inserted, "
                f"{seed_stats['reviews_duplicated']} already present)."
            )

    log_record = CollectionLog(
        property_id=prop.id,
        started_at=started_at,
        completed_at=datetime.now(timezone.utc),
        status=status,
        reviews_found=reviews_found,
        reviews_inserted=reviews_inserted,
        reviews_duplicated=reviews_duplicated,
        error_type=error_type,
        error_message=error_message,
        used_sample_fallback=used_sample_fallback,
    )
    db.add(log_record)
    db.commit()
    db.refresh(log_record)
    return log_record
