from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ReviewResponse(BaseModel):
    id: int
    property_id: int
    property_slug: Optional[str] = None
    property_name: Optional[str] = None
    property_area: Optional[str] = None
    external_review_id: Optional[str] = None
    dedup_hash: str
    reviewer_name: str
    reviewer_country: Optional[str] = None
    room_type: Optional[str] = None
    stay_duration: Optional[str] = None
    stay_date: Optional[str] = None
    review_date: date
    rating: float
    title: Optional[str] = None
    positive_text: Optional[str] = None
    negative_text: Optional[str] = None
    full_text: Optional[str] = None
    sentiment: str
    topics: List[str]
    negative_topics: List[str]
    is_sample_data: bool
    data_source: str
    collected_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedReviewResponse(BaseModel):
    items: List[ReviewResponse]
    total: int
    page: int
    page_size: int
    data_mode: str  # "sample" | "live" | "mixed" | "empty"
