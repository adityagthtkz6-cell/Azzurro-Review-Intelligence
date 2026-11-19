from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.analytics import DashboardOverviewResponse
from app.services.analytics import build_dashboard_overview

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/overview", response_model=DashboardOverviewResponse)
def get_analytics_overview(
    property_slug: Optional[str] = Query(
        None, description="Filter analytics to a single property slug (or 'all')"
    ),
    sentiment: Optional[str] = Query(
        None, description="Filter by sentiment: 'positive' | 'neutral' | 'negative' | 'all'"
    ),
    topic: Optional[str] = Query(
        None, description="Filter by one of the 8 canonical operational topics (or 'all')"
    ),
    search: Optional[str] = Query(
        None, description="Filter by search term in review title, text, or reviewer name"
    ),
    start_date: Optional[date] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[date] = Query(None, description="End date YYYY-MM-DD"),
    data_source: Optional[str] = Query(
        None, description="Filter by data provenance: 'sample' | 'live' | 'all'"
    ),
    db: Session = Depends(get_db),
):
    """
    Return executive KPIs, weekly rating & previous week delta, sentiment split,
    rating distribution, 6-week sentiment trend chart series, operational issue
    percentages (using negative reviews as the denominator), and property card summaries.
    """
    return build_dashboard_overview(
        db=db,
        property_slug=property_slug,
        start_date=start_date,
        end_date=end_date,
        data_source_filter=data_source,
        sentiment_filter=sentiment,
        topic_filter=topic,
        search_filter=search,
    )
