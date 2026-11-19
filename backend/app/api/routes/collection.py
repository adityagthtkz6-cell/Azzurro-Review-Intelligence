from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.collection_log import CollectionLog
from app.models.property import Property
from app.models.review import Review
from app.schemas.collection import CollectionLogResponse
from app.services.collector import collect_public_reviews_for_property
from app.services.seed_sample import seed_sample_reviews

router = APIRouter(prefix="/collections", tags=["Review Collection & Sample Data"])


@router.post("/seed-sample")
def trigger_sample_seed(
    property_slug: Optional[str] = Query(
        None, description="Optional property slug to seed sample data for (defaults to all 4)"
    ),
    db: Session = Depends(get_db),
):
    """
    Explicitly seed clearly labelled sample data (`is_sample_data=True`, `data_source='sample_seed'`)
    with deduplication so demo analytics are available and transparently badged.
    """
    stats = seed_sample_reviews(db=db, property_slug=property_slug)
    return {
        "status": "sample_data_seeded",
        "is_sample_data": True,
        "data_source": "sample_seed",
        **stats,
    }


@router.delete("/sample-data")
def clear_sample_data(db: Session = Depends(get_db)):
    """Remove all sample reviews (`is_sample_data=True`) while preserving any live collected reviews."""
    deleted = db.query(Review).filter(Review.is_sample_data.is_(True)).delete()
    db.commit()
    return {
        "status": "sample_data_cleared",
        "deleted_sample_reviews": deleted,
    }


@router.post("/collect", response_model=List[CollectionLogResponse])
def trigger_public_collection(
    property_slug: Optional[str] = Query(
        None, description="Optional property slug; if omitted, runs across all 4 properties"
    ),
    use_sample_fallback: bool = Query(
        True,
        description="If public collection is blocked or returns 0 public cards, seed clearly labelled sample data",
    ),
    db: Session = Depends(get_db),
):
    """
    Run the permitted public-page Playwright review collector.
    Does not bypass CAPTCHA, authentication, or access restrictions.
    Documents outcomes in `collection_logs`.
    """
    query = db.query(Property).order_by(Property.id.asc())
    if property_slug and property_slug != "all":
        query = query.filter(Property.slug == property_slug)
    props = query.all()
    if not props:
        raise HTTPException(status_code=404, detail="No matching properties found")

    results: List[CollectionLogResponse] = []
    for prop in props:
        log = collect_public_reviews_for_property(
            db=db,
            prop=prop,
            use_sample_fallback_on_empty_or_block=use_sample_fallback,
        )
        results.append(
            CollectionLogResponse(
                id=log.id,
                property_id=log.property_id,
                property_slug=prop.slug,
                property_name=prop.name,
                started_at=log.started_at,
                completed_at=log.completed_at,
                status=log.status,
                reviews_found=log.reviews_found,
                reviews_inserted=log.reviews_inserted,
                reviews_duplicated=log.reviews_duplicated,
                error_type=log.error_type,
                error_message=log.error_message,
                used_sample_fallback=log.used_sample_fallback,
            )
        )
    return results


@router.get("/logs", response_model=List[CollectionLogResponse])
def list_collection_logs(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Return recent review collection & sample-seeding audit logs."""
    rows = (
        db.query(CollectionLog, Property)
        .outerjoin(Property, CollectionLog.property_id == Property.id)
        .order_by(CollectionLog.started_at.desc(), CollectionLog.id.desc())
        .limit(limit)
        .all()
    )
    return [
        CollectionLogResponse(
            id=log.id,
            property_id=log.property_id,
            property_slug=prop.slug if prop else None,
            property_name=prop.name if prop else None,
            started_at=log.started_at,
            completed_at=log.completed_at,
            status=log.status,
            reviews_found=log.reviews_found,
            reviews_inserted=log.reviews_inserted,
            reviews_duplicated=log.reviews_duplicated,
            error_type=log.error_type,
            error_message=log.error_message,
            used_sample_fallback=log.used_sample_fallback,
        )
        for log, prop in rows
    ]
