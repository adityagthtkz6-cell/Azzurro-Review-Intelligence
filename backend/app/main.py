import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import analytics, collection, health, properties, reviews
from app.config import settings
from app.database import init_db_and_properties

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database schema and ensure the 4 Azzurro properties are registered."""
    try:
        init_db_and_properties()
        logger.info("Database schema and Azzurro properties initialized.")
    except Exception as exc:
        logger.warning(
            "Database initialization deferred (ensure PostgreSQL is running and DATABASE_URL is configured): %s",
            exc,
        )
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="0.2.0",
    description=(
        "Booking.com Review Insights & Operational Intelligence API for Azzurro Hotels "
        "(Surry Hills, Potts Point, Central Sydney, Darling Harbour)."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.API_V1_PREFIX)
app.include_router(properties.router, prefix=settings.API_V1_PREFIX)
app.include_router(reviews.router, prefix=settings.API_V1_PREFIX)
app.include_router(analytics.router, prefix=settings.API_V1_PREFIX)
app.include_router(collection.router, prefix=settings.API_V1_PREFIX)
