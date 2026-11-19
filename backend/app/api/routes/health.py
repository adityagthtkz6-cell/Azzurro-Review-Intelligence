from datetime import datetime, timezone
from fastapi import APIRouter

from app.config import settings
from app.database import check_db_connectivity

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    """Health check endpoint verifying service and database availability."""
    db_ok = check_db_connectivity()
    return {
        "status": "healthy" if db_ok else "degraded",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "database_connected": db_ok,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
