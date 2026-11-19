from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PropertyBase(BaseModel):
    slug: str
    name: str
    area: str
    city: str
    country: str
    booking_url: str


class PropertyResponse(PropertyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PropertyCardSummary(PropertyResponse):
    total_reviews: int = 0
    avg_weekly_rating: Optional[float] = None
    previous_week_rating: Optional[float] = None
    weekly_rating_delta: Optional[float] = None
    overall_avg_rating: Optional[float] = None
    positive_count: int = 0
    neutral_count: int = 0
    negative_count: int = 0
    top_issue: Optional[str] = None
    has_sample_data: bool = False
    has_live_data: bool = False
