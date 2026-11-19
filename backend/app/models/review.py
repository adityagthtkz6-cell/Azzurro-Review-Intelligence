from datetime import date, datetime, timezone
from typing import List, Optional, TYPE_CHECKING
from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.property import Property


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    property_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("properties.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )

    # Deduplication fields
    external_review_id: Mapped[Optional[str]] = mapped_column(String(128), index=True, nullable=True)
    dedup_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)

    # Guest & stay metadata
    reviewer_name: Mapped[str] = mapped_column(String(120), default="Anonymous Guest", nullable=False)
    reviewer_country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    room_type: Mapped[Optional[str]] = mapped_column(String(160), nullable=True)
    stay_duration: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    stay_date: Mapped[Optional[str]] = mapped_column(String(80), nullable=True)
    review_date: Mapped[date] = mapped_column(Date, index=True, nullable=False)

    # Rating & content (normalized to Booking.com 0-10 scale)
    rating: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    title: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    positive_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    negative_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    full_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # NLP & Operational Intelligence Classification
    sentiment: Mapped[str] = mapped_column(
        String(24),
        index=True,
        nullable=False,
        comment="positive | neutral | negative",
    )
    topics: Mapped[List[str]] = mapped_column(
        JSON,
        default=list,
        nullable=False,
        comment="Matched operational categories out of the 8 canonical topics",
    )
    negative_topics: Mapped[List[str]] = mapped_column(
        JSON,
        default=list,
        nullable=False,
        comment="Operational categories specifically raised as issues in negative reviews",
    )

    # Provenance & Transparency Flags (never mix sample data with actual Booking.com data)
    is_sample_data: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        index=True,
        nullable=False,
    )
    data_source: Mapped[str] = mapped_column(
        String(40),
        default="booking_public",
        nullable=False,
        comment="booking_public | sample_seed",
    )

    collected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    property: Mapped["Property"] = relationship("Property", back_populates="reviews")
