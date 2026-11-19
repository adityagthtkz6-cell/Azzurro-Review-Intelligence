from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.property import Property
from app.models.review import Review
from app.schemas.review import PaginatedReviewResponse, ReviewResponse

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("", response_model=PaginatedReviewResponse)
def list_reviews(
    property_slug: Optional[str] = Query(None, description="Filter by property slug (or 'all')"),
    sentiment: Optional[str] = Query(None, description="Filter by sentiment: positive | neutral | negative"),
    topic: Optional[str] = Query(None, description="Filter by one of the 8 canonical operational topics"),
    data_source: Optional[str] = Query(None, description="Filter by provenance: sample | live | all"),
    search: Optional[str] = Query(None, description="Search in review title or text"),
    start_date: Optional[date] = Query(None, description="Filter reviews on or after YYYY-MM-DD"),
    end_date: Optional[date] = Query(None, description="Filter reviews on or before YYYY-MM-DD"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Return filtered, paginated guest reviews with explicit sample/live provenance tags."""
    query = db.query(Review, Property).join(Property, Review.property_id == Property.id)

    if property_slug and property_slug != "all":
        query = query.filter(Property.slug == property_slug)
    if sentiment and sentiment != "all":
        query = query.filter(Review.sentiment == sentiment)
    if data_source == "sample":
        query = query.filter(Review.is_sample_data.is_(True))
    elif data_source == "live":
        query = query.filter(Review.is_sample_data.is_(False))
    if start_date:
        query = query.filter(Review.review_date >= start_date)
    if end_date:
        query = query.filter(Review.review_date <= end_date)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Review.title.ilike(term),
                Review.positive_text.ilike(term),
                Review.negative_text.ilike(term),
                Review.reviewer_name.ilike(term),
            )
        )

    rows = query.order_by(Review.review_date.desc(), Review.id.desc()).all()

    # Topic filter on JSON array
    if topic and topic != "all":
        rows = [
            (rev, prop)
            for rev, prop in rows
            if topic in (rev.topics or []) or topic in (rev.negative_topics or [])
        ]

    total = len(rows)
    has_sample = any(rev.is_sample_data for rev, _ in rows)
    has_live = any(not rev.is_sample_data for rev, _ in rows)

    if total == 0:
        data_mode = "empty"
    elif has_sample and has_live:
        data_mode = "mixed"
    elif has_sample:
        data_mode = "sample"
    else:
        data_mode = "live"

    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    page_rows = rows[start_idx:end_idx]

    items = [
        ReviewResponse(
            id=rev.id,
            property_id=rev.property_id,
            property_slug=prop.slug,
            property_name=prop.name,
            property_area=prop.area,
            external_review_id=rev.external_review_id,
            dedup_hash=rev.dedup_hash,
            reviewer_name=rev.reviewer_name,
            reviewer_country=rev.reviewer_country,
            room_type=rev.room_type,
            stay_duration=rev.stay_duration,
            stay_date=rev.stay_date,
            review_date=rev.review_date,
            rating=rev.rating,
            title=rev.title,
            positive_text=rev.positive_text,
            negative_text=rev.negative_text,
            full_text=rev.full_text,
            sentiment=rev.sentiment,
            topics=rev.topics or [],
            negative_topics=rev.negative_topics or [],
            is_sample_data=rev.is_sample_data,
            data_source=rev.data_source,
            collected_at=rev.collected_at,
        )
        for rev, prop in page_rows
    ]

    return PaginatedReviewResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        data_mode=data_mode,
    )
