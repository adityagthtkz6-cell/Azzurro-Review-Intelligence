import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import DEFAULT_AZZURRO_PROPERTIES, settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    """Declarative base for all SQLAlchemy ORM models."""


def _build_engine():
    """Create SQLAlchemy engine configured for PostgreSQL (with SQLite compatibility if configured via env)."""
    db_url = settings.DATABASE_URL
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)
    elif db_url.startswith("postgresql+psycopg2://"):
        db_url = db_url.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    else:
        connect_args = {"connect_timeout": 2}
    return create_engine(
        db_url,
        pool_pre_ping=True,
        connect_args=connect_args,
    )


engine = _build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency providing a scoped database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db_and_properties() -> None:
    """Create database tables and ensure the four Azzurro Hotels properties exist."""
    from app.models.collection_log import CollectionLog  # noqa: F401
    from app.models.property import Property
    from app.models.review import Review  # noqa: F401

    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        for prop_cfg in DEFAULT_AZZURRO_PROPERTIES:
            existing = (
                db.query(Property)
                .filter(Property.slug == prop_cfg["slug"])
                .first()
            )
            if not existing:
                db.add(Property(**prop_cfg))
        db.commit()

        if db.query(Review).count() == 0:
            from app.services.seed_sample import seed_sample_reviews

            seed_sample_reviews(db)


def check_db_connectivity() -> bool:
    """Verify database connectivity for the health endpoint."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.warning("Database connectivity check failed: %s", exc)
        return False
