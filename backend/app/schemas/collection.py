from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class CollectionLogResponse(BaseModel):
    id: int
    property_id: Optional[int] = None
    property_slug: Optional[str] = None
    property_name: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: str
    reviews_found: int
    reviews_inserted: int
    reviews_duplicated: int
    error_type: Optional[str] = None
    error_message: Optional[str] = None
    used_sample_fallback: bool

    model_config = ConfigDict(from_attributes=True)
