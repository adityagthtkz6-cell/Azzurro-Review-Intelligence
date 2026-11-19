from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.config import CANONICAL_TOPICS
from app.models.property import Property
from app.models.review import Review
from app.schemas.analytics import (
    DashboardOverviewResponse,
    OperationalIssueMetric,
    RatingBucket,
    SentimentSummary,
    WeeklyTrendPoint,
)
from app.schemas.property import PropertyCardSummary


def _round_opt(val: Optional[float], digits: int = 2) -> Optional[float]:
    if val is None:
        return None
    return round(float(val), digits)


def _compute_weekly_window_stats(reviews: List[Review], reference_date: date):
    """
    Calculate current 7-day average rating, previous 7-day average rating,
    and week-over-week delta.
    """
    current_start = reference_date - timedelta(days=6)
    prev_end = current_start - timedelta(days=1)
    prev_start = prev_end - timedelta(days=6)

    curr_scores = [
        r.rating for r in reviews if current_start <= r.review_date <= reference_date
    ]
    prev_scores = [
        r.rating for r in reviews if prev_start <= r.review_date <= prev_end
    ]

    avg_curr = sum(curr_scores) / len(curr_scores) if curr_scores else None
    avg_prev = sum(prev_scores) / len(prev_scores) if prev_scores else None

    delta = None
    if avg_curr is not None and avg_prev is not None:
        delta = avg_curr - avg_prev

    return _round_opt(avg_curr, 2), _round_opt(avg_prev, 2), _round_opt(delta, 2)


def build_dashboard_overview(
    db: Session,
    property_slug: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    data_source_filter: Optional[str] = None,
    sentiment_filter: Optional[str] = None,
    topic_filter: Optional[str] = None,
    search_filter: Optional[str] = None,
) -> DashboardOverviewResponse:
    """
    Compute comprehensive executive analytics across all properties or a filtered subset.
    - Issue percentages use negative reviews as the denominator.
    - Explicitly reports `data_mode` ('sample', 'live', 'mixed', or 'empty') so sample data is never misrepresented.
    """
    all_properties = db.query(Property).order_by(Property.id.asc()).all()

    review_query = db.query(Review).join(Property, Review.property_id == Property.id)
    if property_slug and property_slug != "all":
        review_query = review_query.filter(Property.slug == property_slug)
    if sentiment_filter and sentiment_filter != "all":
        review_query = review_query.filter(Review.sentiment == sentiment_filter)
    if start_date:
        review_query = review_query.filter(Review.review_date >= start_date)
    if end_date:
        review_query = review_query.filter(Review.review_date <= end_date)
    if data_source_filter == "sample":
        review_query = review_query.filter(Review.is_sample_data.is_(True))
    elif data_source_filter == "live":
        review_query = review_query.filter(Review.is_sample_data.is_(False))
    if search_filter and search_filter.strip():
        term = f"%{search_filter.strip()}%"
        review_query = review_query.filter(
            or_(
                Review.title.ilike(term),
                Review.positive_text.ilike(term),
                Review.negative_text.ilike(term),
                Review.reviewer_name.ilike(term),
            )
        )

    reviews: List[Review] = review_query.order_by(Review.review_date.desc()).all()
    if topic_filter and topic_filter != "all":
        reviews = [
            r
            for r in reviews
            if topic_filter in (r.topics or []) or topic_filter in (r.negative_topics or [])
        ]

    total_reviews = len(reviews)
    has_sample = any(r.is_sample_data for r in reviews)
    has_live = any(not r.is_sample_data for r in reviews)

    if total_reviews == 0:
        data_mode = "empty"
    elif has_sample and has_live:
        data_mode = "mixed"
    elif has_sample:
        data_mode = "sample"
    else:
        data_mode = "live"

    ref_date = (
        max((r.review_date for r in reviews), default=datetime.now(timezone.utc).date())
        if reviews
        else datetime.now(timezone.utc).date()
    )

    avg_weekly, prev_weekly, weekly_delta = _compute_weekly_window_stats(reviews, ref_date)
    overall_avg = (
        round(sum(r.rating for r in reviews) / total_reviews, 2)
        if total_reviews > 0
        else None
    )

    # Sentiment breakdown
    pos_count = sum(1 for r in reviews if r.sentiment == "positive")
    neu_count = sum(1 for r in reviews if r.sentiment == "neutral")
    neg_count = sum(1 for r in reviews if r.sentiment == "negative")

    sentiment_summary = SentimentSummary(
        positive_count=pos_count,
        neutral_count=neu_count,
        negative_count=neg_count,
        positive_pct=round((pos_count / total_reviews) * 100, 1) if total_reviews else 0.0,
        neutral_pct=round((neu_count / total_reviews) * 100, 1) if total_reviews else 0.0,
        negative_pct=round((neg_count / total_reviews) * 100, 1) if total_reviews else 0.0,
    )

    # Rating distribution (Booking.com 10-point buckets)
    bucket_defs = [
        ("9.0 – 10 Exceptional", 9.0, 10.0),
        ("7.0 – 8.9 Good", 7.0, 8.99),
        ("5.0 – 6.9 Fair", 5.0, 6.99),
        ("1.0 – 4.9 Poor", 0.0, 4.99),
    ]
    rating_distribution: List[RatingBucket] = []
    for label, b_min, b_max in bucket_defs:
        cnt = sum(1 for r in reviews if b_min <= r.rating <= b_max)
        pct = round((cnt / total_reviews) * 100, 1) if total_reviews else 0.0
        rating_distribution.append(
            RatingBucket(
                bucket_label=label,
                min_score=b_min,
                max_score=b_max,
                count=cnt,
                percentage=pct,
            )
        )

    # Weekly sentiment trend series (last 6 calendar weeks up to ref_date)
    ref_week_monday = ref_date - timedelta(days=ref_date.weekday())
    week_starts = [ref_week_monday - timedelta(weeks=w) for w in range(5, -1, -1)]
    weekly_buckets = {ws: [] for ws in week_starts}
    for r in reviews:
        r_monday = r.review_date - timedelta(days=r.review_date.weekday())
        if r_monday in weekly_buckets:
            weekly_buckets[r_monday].append(r)

    weekly_trends: List[WeeklyTrendPoint] = []
    for ws in week_starts:
        w_revs = weekly_buckets[ws]
        w_total = len(w_revs)
        w_avg = round(sum(r.rating for r in w_revs) / w_total, 2) if w_total else None
        weekly_trends.append(
            WeeklyTrendPoint(
                week_start=ws.isoformat(),
                week_label=ws.strftime("%b %d"),
                total_reviews=w_total,
                avg_rating=w_avg,
                positive_count=sum(1 for r in w_revs if r.sentiment == "positive"),
                neutral_count=sum(1 for r in w_revs if r.sentiment == "neutral"),
                negative_count=sum(1 for r in w_revs if r.sentiment == "negative"),
            )
        )

    # Operational Issue Analysis:
    # Denominator MUST be negative reviews (neg_count)
    negative_reviews = [r for r in reviews if r.sentiment == "negative"]
    neg_denominator = len(negative_reviews)

    operational_issues: List[OperationalIssueMetric] = []
    for topic in CANONICAL_TOPICS:
        neg_mentions = sum(
            1
            for r in negative_reviews
            if topic in (r.negative_topics or [])
        )
        all_mentions = sum(1 for r in reviews if topic in (r.topics or []))
        issue_pct = (
            round((neg_mentions / neg_denominator) * 100, 1)
            if neg_denominator > 0
            else 0.0
        )
        operational_issues.append(
            OperationalIssueMetric(
                topic=topic,
                negative_mentions=neg_mentions,
                total_negative_reviews_denominator=neg_denominator,
                issue_percentage_of_negative=issue_pct,
                total_mentions_all_sentiments=all_mentions,
            )
        )

    operational_issues.sort(
        key=lambda x: (x.issue_percentage_of_negative, x.total_mentions_all_sentiments),
        reverse=True,
    )

    # Property card summaries (always compute for all 4 Azzurro properties respecting active date/sentiment/topic/search filters)
    all_prop_reviews_query = db.query(Review)
    if sentiment_filter and sentiment_filter != "all":
        all_prop_reviews_query = all_prop_reviews_query.filter(
            Review.sentiment == sentiment_filter
        )
    if start_date:
        all_prop_reviews_query = all_prop_reviews_query.filter(Review.review_date >= start_date)
    if end_date:
        all_prop_reviews_query = all_prop_reviews_query.filter(Review.review_date <= end_date)
    if data_source_filter == "sample":
        all_prop_reviews_query = all_prop_reviews_query.filter(Review.is_sample_data.is_(True))
    elif data_source_filter == "live":
        all_prop_reviews_query = all_prop_reviews_query.filter(Review.is_sample_data.is_(False))
    if search_filter and search_filter.strip():
        term = f"%{search_filter.strip()}%"
        all_prop_reviews_query = all_prop_reviews_query.filter(
            or_(
                Review.title.ilike(term),
                Review.positive_text.ilike(term),
                Review.negative_text.ilike(term),
                Review.reviewer_name.ilike(term),
            )
        )

    by_prop: dict[int, List[Review]] = defaultdict(list)
    for rev in all_prop_reviews_query.all():
        if topic_filter and topic_filter != "all":
            if topic_filter not in (rev.topics or []) and topic_filter not in (
                rev.negative_topics or []
            ):
                continue
        by_prop[rev.property_id].append(rev)

    property_cards: List[PropertyCardSummary] = []
    for prop in all_properties:
        p_revs = by_prop.get(prop.id, [])
        p_total = len(p_revs)
        p_ref = max((r.review_date for r in p_revs), default=ref_date) if p_revs else ref_date
        p_curr_w, p_prev_w, p_delta = _compute_weekly_window_stats(p_revs, p_ref)
        p_overall = (
            round(sum(r.rating for r in p_revs) / p_total, 2) if p_total > 0 else None
        )
        p_neg_revs = [r for r in p_revs if r.sentiment == "negative"]

        # Find top operational issue for this property
        top_issue: Optional[str] = None
        if p_neg_revs:
            topic_counts = defaultdict(int)
            for r in p_neg_revs:
                for t in r.negative_topics or r.topics or []:
                    topic_counts[t] += 1
            if topic_counts:
                top_issue = max(topic_counts.items(), key=lambda kv: kv[1])[0]

        property_cards.append(
            PropertyCardSummary(
                id=prop.id,
                slug=prop.slug,
                name=prop.name,
                area=prop.area,
                city=prop.city,
                country=prop.country,
                booking_url=prop.booking_url,
                created_at=prop.created_at,
                updated_at=prop.updated_at,
                total_reviews=p_total,
                avg_weekly_rating=p_curr_w,
                previous_week_rating=p_prev_w,
                weekly_rating_delta=p_delta,
                overall_avg_rating=p_overall,
                positive_count=sum(1 for r in p_revs if r.sentiment == "positive"),
                neutral_count=sum(1 for r in p_revs if r.sentiment == "neutral"),
                negative_count=len(p_neg_revs),
                top_issue=top_issue,
                has_sample_data=any(r.is_sample_data for r in p_revs),
                has_live_data=any(not r.is_sample_data for r in p_revs),
            )
        )

    return DashboardOverviewResponse(
        data_mode=data_mode,
        is_sample_data_active=has_sample,
        total_reviews=total_reviews,
        avg_weekly_rating=avg_weekly,
        previous_week_rating=prev_weekly,
        weekly_rating_delta=weekly_delta,
        overall_avg_rating=overall_avg,
        sentiment=sentiment_summary,
        rating_distribution=rating_distribution,
        weekly_trends=weekly_trends,
        operational_issues=operational_issues,
        properties=property_cards,
    )
