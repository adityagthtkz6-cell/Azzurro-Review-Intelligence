import hashlib
import re
from datetime import date
from typing import Dict, List, Optional, Tuple


TOPIC_KEYWORDS: Dict[str, List[str]] = {
    "Cleanliness": [
        "clean",
        "dirty",
        "dust",
        "stain",
        "smell",
        "odor",
        "odour",
        "hygiene",
        "housekeeping",
        "spotless",
        "filthy",
        "mold",
        "mould",
        "towel",
        "sheets",
        "linen",
        "bathroom clean",
        "hair",
        "trash",
        "rubbish",
    ],
    "Check-in": [
        "check-in",
        "check in",
        "checkin",
        "check-out",
        "check out",
        "key",
        "keycard",
        "lockbox",
        "code",
        "arrival",
        "reception hours",
        "late arrival",
        "early check",
        "deposit",
        "registration",
        "self check",
    ],
    "Staff": [
        "staff",
        "receptionist",
        "manager",
        "service",
        "helpful",
        "rude",
        "friendly",
        "welcoming",
        "host",
        "team",
        "customer service",
        "polite",
        "unhelpful",
        "attentive",
        "concierge",
    ],
    "Noise": [
        "noise",
        "noisy",
        "loud",
        "quiet",
        "soundproof",
        "thin walls",
        "traffic",
        "street noise",
        "party",
        "sleep",
        "earplugs",
        "construction",
        "hallway noise",
        "sirens",
        "music",
    ],
    "Facilities": [
        "wifi",
        "wi-fi",
        "internet",
        "kitchen",
        "elevator",
        "lift",
        "laundry",
        "pool",
        "gym",
        "parking",
        "tv",
        "television",
        "fridge",
        "kettle",
        "microwave",
        "amenities",
        "Shared bathroom",
        "lounge",
    ],
    "Location": [
        "location",
        "central",
        "walk",
        "walking distance",
        "station",
        "train",
        "bus",
        "metro",
        "darling harbour",
        "surry hills",
        "potts point",
        "cbd",
        "restaurants",
        "cafes",
        "convenient",
        "close to",
        "neighborhood",
        "neighbourhood",
    ],
    "Room condition": [
        "bed",
        "mattress",
        "pillow",
        "air conditioning",
        "aircon",
        "a/c",
        "heating",
        "shower",
        "hot water",
        "water pressure",
        "window",
        "cramped",
        "spacious",
        "small room",
        "dated",
        "renovated",
        "maintenance",
        "broken",
        "furniture",
        "carpet",
        "ventilation",
    ],
    "Value for money": [
        "value",
        "price",
        "money",
        "expensive",
        "cheap",
        "affordable",
        "overpriced",
        "worth",
        "budget",
        "cost",
        "rate",
        "deal",
        "rip off",
    ],
}

NEGATIVE_CUE_WORDS = [
    "dirty",
    "filthy",
    "stain",
    "smell",
    "broken",
    "rude",
    "unhelpful",
    "noisy",
    "loud",
    "thin walls",
    "overpriced",
    "expensive",
    "cold water",
    "no hot water",
    "poor",
    "terrible",
    "horrible",
    "awful",
    "worst",
    "disappointing",
    "issue",
    "problem",
    "mold",
    "mould",
    "dust",
    "cramped",
    "slow wifi",
    "no lift",
    "uncomfortable",
]


def compute_review_dedup_hash(
    property_id: int,
    reviewer_name: str,
    review_date: date,
    title: Optional[str],
    positive_text: Optional[str],
    negative_text: Optional[str],
    external_review_id: Optional[str] = None,
) -> str:
    """Compute a deterministic SHA-256 fingerprint to prevent duplicate review insertion."""
    if external_review_id and external_review_id.strip():
        raw = f"ext:{property_id}:{external_review_id.strip().lower()}"
    else:
        norm_name = re.sub(r"\s+", " ", (reviewer_name or "anonymous").strip().lower())
        norm_title = re.sub(r"\s+", " ", (title or "").strip().lower())
        norm_pos = re.sub(r"\s+", " ", (positive_text or "").strip().lower())[:160]
        norm_neg = re.sub(r"\s+", " ", (negative_text or "").strip().lower())[:160]
        raw = f"content:{property_id}:{norm_name}:{review_date.isoformat()}:{norm_title}:{norm_pos}:{norm_neg}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def classify_sentiment(
    rating: float,
    positive_text: Optional[str] = None,
    negative_text: Optional[str] = None,
    full_text: Optional[str] = None,
) -> str:
    """Classify a review into 'positive', 'neutral', or 'negative' using 10-pt score and text cues."""
    neg_len = len((negative_text or "").strip())
    pos_len = len((positive_text or "").strip())

    if rating >= 7.5:
        if rating < 8.0 and neg_len > pos_len * 2 and neg_len > 80:
            return "neutral"
        return "positive"
    if rating < 5.8:
        return "negative"

    # For scores between 5.8 and 7.4, check if negative complaints dominate
    combined_neg = f"{negative_text or ''} {full_text or ''}".lower()
    severe_hits = sum(1 for cue in NEGATIVE_CUE_WORDS if cue in combined_neg)
    if rating <= 6.2 and (severe_hits >= 2 or neg_len > 60):
        return "negative"
    return "neutral"


def _match_topics_in_text(text_content: str) -> List[str]:
    if not text_content or not text_content.strip():
        return []
    lowered = text_content.lower()
    matched: List[str] = []
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(kw.lower() in lowered for kw in keywords):
            matched.append(topic)
    return matched


def classify_topics(
    sentiment: str,
    title: Optional[str] = None,
    positive_text: Optional[str] = None,
    negative_text: Optional[str] = None,
    full_text: Optional[str] = None,
) -> Tuple[List[str], List[str]]:
    """
    Classify review text into the 8 canonical operational categories.
    Returns (all_topics, negative_topics).
    - `all_topics`: every topic mentioned in the review.
    - `negative_topics`: topics specifically implicated in negative feedback
      (used when calculating issue percentages with negative reviews as denominator).
    """
    combined_all = " ".join(
        part for part in [title, positive_text, negative_text, full_text] if part
    )
    all_topics = _match_topics_in_text(combined_all)

    # Extract topics specifically from negative text or negative reviews
    negative_context = " ".join(
        part for part in [negative_text, title if sentiment == "negative" else None] if part
    )
    neg_topics = _match_topics_in_text(negative_context)

    if sentiment == "negative" and not neg_topics:
        neg_topics = list(all_topics)
        if not neg_topics:
            neg_topics = ["Room condition"]
            all_topics = ["Room condition"]

    if not all_topics:
        all_topics = ["Location"]

    return all_topics, neg_topics
