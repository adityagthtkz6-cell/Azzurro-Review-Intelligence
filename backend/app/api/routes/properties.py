from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config import DEFAULT_AZZURRO_PROPERTIES
from app.database import get_db
from app.models.property import Property
from app.schemas.property import PropertyResponse

router = APIRouter(prefix="/properties", tags=["Properties"])


def _fallback_properties() -> List[PropertyResponse]:
    now = datetime.now(timezone.utc)
    return [
        PropertyResponse(
            id=idx + 1,
            created_at=now,
            updated_at=now,
            **cfg,
        )
        for idx, cfg in enumerate(DEFAULT_AZZURRO_PROPERTIES)
    ]


@router.get("", response_model=List[PropertyResponse])
def list_properties(db: Session = Depends(get_db)):
    """Return all configured Azzurro Hotels properties (from PostgreSQL or configured seed fallback if DB is offline)."""
    try:
        items = db.query(Property).order_by(Property.id.asc()).all()
        if items:
            return items
        return _fallback_properties()
    except Exception:
        return _fallback_properties()


@router.get("/{slug}", response_model=PropertyResponse)
def get_property_by_slug(slug: str, db: Session = Depends(get_db)):
    """Return details for a specific Azzurro property by its slug."""
    try:
        prop = db.query(Property).filter(Property.slug == slug).first()
        if prop:
            return prop
    except Exception:
        pass

    for item in _fallback_properties():
        if item.slug == slug:
            return item
    raise HTTPException(status_code=404, detail=f"Property '{slug}' not found")
