from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.property import Property


class CollectionLog(Base):
    __tablename__ = "collection_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    property_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("properties.id", ondelete="SET NULL"),
        index=True,
        nullable=True,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped[str] = mapped_column(
        String(40),
        index=True,
        nullable=False,
        comment="running | success | partial | blocked_or_unavailable | failed | sample_fallback",
    )

    reviews_found: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reviews_inserted: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    reviews_duplicated: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    error_type: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    used_sample_fallback: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    property: Mapped[Optional["Property"]] = relationship("Property", back_populates="collection_logs")
