from typing import List, Optional
from pydantic import BaseModel

from app.schemas.property import PropertyCardSummary


class SentimentSummary(BaseModel):
    positive_count: int = 0
    neutral_count: int = 0
    negative_count: int = 0
    positive_pct: float = 0.0
    neutral_pct: float = 0.0
    negative_pct: float = 0.0


class RatingBucket(BaseModel):
    bucket_label: str  # e.g. "9-10 Exceptional", "7-8.9 Good", "5-6.9 Fair", "1-4.9 Poor"
    min_score: float
    max_score: float
    count: int = 0
    percentage: float = 0.0


class WeeklyTrendPoint(BaseModel):
    week_start: str  # ISO date string YYYY-MM-DD
    week_label: str  # e.g. "Nov 10"
    total_reviews: int = 0
    avg_rating: Optional[float] = None
    positive_count: int = 0
    neutral_count: int = 0
    negative_count: int = 0


class OperationalIssueMetric(BaseModel):
    topic: str
    negative_mentions: int = 0
    total_negative_reviews_denominator: int = 0
    issue_percentage_of_negative: float = 0.0
    total_mentions_all_sentiments: int = 0


class DashboardOverviewResponse(BaseModel):
    data_mode: str  # "sample" | "live" | "empty"
    is_sample_data_active: bool
    total_reviews: int = 0
    avg_weekly_rating: Optional[float] = None
    previous_week_rating: Optional[float] = None
    weekly_rating_delta: Optional[float] = None
    overall_avg_rating: Optional[float] = None
    sentiment: SentimentSummary
    rating_distribution: List[RatingBucket]
    weekly_trends: List[WeeklyTrendPoint]
    operational_issues: List[OperationalIssueMetric]
    properties: List[PropertyCardSummary]
