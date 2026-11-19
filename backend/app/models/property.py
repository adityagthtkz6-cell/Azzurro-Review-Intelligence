from datetime import datetime, timezone
from typing import List, TYPE_CHECKING
from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.collection_log import CollectionLog
    from app.models.review import Review


class Property(Base):
    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    area: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[str] = mapped_column(String(100), default="Sydney", nullable=False)
    country: Mapped[str] = mapped_column(String(100), default="Australia", nullable=False)
    booking_url: Mapped[str] = mapped_column(String(512), unique=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    reviews: Mapped[List["Review"]] = relationship(
        "Review",
        back_populates="property",
        cascade="all, delete-orphan",
    )
    collection_logs: Mapped[List["CollectionLog"]] = relationship(
        "CollectionLog",
        back_populates="property",
        cascade="all, delete-orphan",
    )
