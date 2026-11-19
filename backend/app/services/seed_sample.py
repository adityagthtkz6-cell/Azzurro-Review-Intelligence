from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.collection_log import CollectionLog
from app.models.property import Property
from app.models.review import Review
from app.services.classifier import (
    classify_sentiment,
    classify_topics,
    compute_review_dedup_hash,
)


# Realistic, clearly-tagged sample reviews distributed across the 4 Azzurro properties
# and spanning the most recent 6 weeks so weekly ratings & WoW comparisons are meaningful.
SAMPLE_REVIEWS_BY_SLUG: Dict[str, List[Dict]] = {
    "surry-hills": [
        {
            "days_ago": 1,
            "reviewer_name": "Amelia T. (Sample)",
            "reviewer_country": "Australia",
            "room_type": "Deluxe Queen Studio",
            "stay_duration": "3 nights",
            "rating": 9.2,
            "title": "Fantastic Surry Hills location and spotless studio",
            "positive_text": "Loved the central location near Crown Street cafes and Central Station. The room was spotless, sheets were crisp and clean, and staff at reception were warm and helpful.",
            "negative_text": "Nothing major, street traffic was slightly audible in the morning.",
        },
        {
            "days_ago": 2,
            "reviewer_name": "Marcus V. (Sample)",
            "reviewer_country": "United Kingdom",
            "room_type": "Standard Double Room",
            "stay_duration": "2 nights",
            "rating": 8.6,
            "title": "Great value for money in a vibrant neighbourhood",
            "positive_text": "Great value for the price in Sydney. Easy self check-in with lockbox code and fast Wi-Fi for remote work.",
            "negative_text": "The compact bathroom shower pressure could be stronger.",
        },
        {
            "days_ago": 4,
            "reviewer_name": "Chloe K. (Sample)",
            "reviewer_country": "New Zealand",
            "room_type": "Compact Twin Room",
            "stay_duration": "4 nights",
            "rating": 4.8,
            "title": "Noisy street room and delayed check-in code",
            "positive_text": "Close to restaurants and train station.",
            "negative_text": "Check-in code arrived late and we waited outside. Street noise and thin walls made it hard to sleep, and the air conditioning rattled all night.",
        },
        {
            "days_ago": 6,
            "reviewer_name": "Daniel H. (Sample)",
            "reviewer_country": "Singapore",
            "room_type": "Deluxe Queen Studio",
            "stay_duration": "2 nights",
            "rating": 8.8,
            "title": "Clean, comfortable bed and seamless arrival",
            "positive_text": "Very comfortable mattress, clean towels, and helpful staff who stored our luggage early.",
            "negative_text": "No elevator to the upper floor so be ready for stairs.",
        },
        {
            "days_ago": 9,
            "reviewer_name": "Sophie L. (Sample)",
            "reviewer_country": "Australia",
            "room_type": "Standard Double Room",
            "stay_duration": "1 night",
            "rating": 7.9,
            "title": "Convenient overnight stay near Central",
            "positive_text": "Great location within walking distance of Central station and good price for a weekend stay.",
            "negative_text": "Room furniture felt slightly dated.",
        },
        {
            "days_ago": 11,
            "reviewer_name": "Liam R. (Sample)",
            "reviewer_country": "Canada",
            "room_type": "Standard Double Room",
            "stay_duration": "3 nights",
            "rating": 4.5,
            "title": "Housekeeping missed dust and Wi-Fi dropped",
            "positive_text": "Location in Surry Hills is convenient.",
            "negative_text": "Found dust under the bed and stain on the carpet. The Wi-Fi internet kept disconnecting and felt overpriced for the room condition.",
        },
        {
            "days_ago": 16,
            "reviewer_name": "Hannah M. (Sample)",
            "reviewer_country": "Australia",
            "room_type": "Superior Studio",
            "stay_duration": "2 nights",
            "rating": 9.0,
            "title": "Spotless room and friendly team",
            "positive_text": "Housekeeping did an amazing job, everything was clean and fresh. Staff gave great local cafe tips.",
            "negative_text": None,
        },
        {
            "days_ago": 23,
            "reviewer_name": "Oliver P. (Sample)",
            "reviewer_country": "Germany",
            "room_type": "Compact Twin Room",
            "stay_duration": "5 nights",
            "rating": 6.8,
            "title": "Decent budget base for exploring Sydney",
            "positive_text": "Good location and affordable rate for five nights.",
            "negative_text": "Small room and shared laundry machine was busy.",
        },
        {
            "days_ago": 30,
            "reviewer_name": "Grace W. (Sample)",
            "reviewer_country": "United States",
            "room_type": "Deluxe Queen Studio",
            "stay_duration": "3 nights",
            "rating": 8.5,
            "title": "Smooth self check-in and great coffee nearby",
            "positive_text": "Arrival instructions were clear, bed was cosy, and location is unbeatable.",
            "negative_text": None,
        },
    ],
    "potts-point": [
        {
            "days_ago": 1,
            "reviewer_name": "Ethan B. (Sample)",
            "reviewer_country": "Australia",
            "room_type": "Boutique Queen Room",
            "stay_duration": "2 nights",
            "rating": 8.9,
            "title": "Charming Potts Point stay with lovely staff",
            "positive_text": "Staff were super welcoming and polite. Room was very clean and walking distance to Kings Cross station and Macleay Street dining.",
            "negative_text": "No onsite parking available.",
        },
        {
            "days_ago": 3,
            "reviewer_name": "Isabella C. (Sample)",
            "reviewer_country": "France",
            "room_type": "Studio Apartment",
            "stay_duration": "4 nights",
            "rating": 4.6,
            "title": "Loud hallway noise and hot water issue",
            "positive_text": "Nice neighbourhood with leafy streets.",
            "negative_text": "Hot water in the shower ran cold on two mornings, and noisy guests in the hallway woke us up past midnight. Reception staff were slow to respond.",
        },
        {
            "days_ago": 5,
            "reviewer_name": "Noah G. (Sample)",
            "reviewer_country": "Australia",
            "room_type": "Boutique Queen Room",
            "stay_duration": "2 nights",
            "rating": 8.4,
            "title": "Great value and super convenient location",
            "positive_text": "Excellent value for money in Potts Point. Clean linen, working air conditioning, and fast check-in.",
            "negative_text": "Lift was a bit slow during checkout.",
        },
        {
            "days_ago": 8,
            "reviewer_name": "Mia S. (Sample)",
            "reviewer_country": "United Kingdom",
            "room_type": "Deluxe Balcony Room",
            "stay_duration": "3 nights",
            "rating": 9.1,
            "title": "Lovely balcony and spotless presentation",
            "positive_text": "Spotless bathroom, great kitchenette facilities with fridge and kettle, and friendly receptionist.",
            "negative_text": None,
        },
        {
            "days_ago": 10,
            "reviewer_name": "Lucas D. (Sample)",
            "reviewer_country": "Japan",
            "room_type": "Standard Double",
            "stay_duration": "2 nights",
            "rating": 5.1,
            "title": "Cramped room and musty smell in bathroom",
            "positive_text": "Close to train station.",
            "negative_text": "Bathroom had a damp smell and mould near the shower tile. Room felt very cramped and overpriced for what you get.",
        },
        {
            "days_ago": 13,
            "reviewer_name": "Zoe F. (Sample)",
            "reviewer_country": "Australia",
            "room_type": "Boutique Queen Room",
            "stay_duration": "1 night",
            "rating": 7.8,
            "title": "Good weekend base in Potts Point",
            "positive_text": "Clean bed and easy check-in process.",
            "negative_text": "Street noise on Saturday night.",
        },
        {
            "days_ago": 19,
            "reviewer_name": "Jack N. (Sample)",
            "reviewer_country": "New Zealand",
            "room_type": "Studio Apartment",
            "stay_duration": "4 nights",
            "rating": 8.7,
            "title": "Well equipped studio and attentive team",
            "positive_text": "Kitchenette facilities were handy, Wi-Fi was fast, and staff helped us with early check-in.",
            "negative_text": None,
        },
        {
            "days_ago": 27,
            "reviewer_name": "Charlotte A. (Sample)",
            "reviewer_country": "United States",
            "room_type": "Standard Double",
            "stay_duration": "3 nights",
            "rating": 6.5,
            "title": "Average stay, great location though",
            "positive_text": "Location in Potts Point is wonderful for cafes.",
            "negative_text": "Mattress was a little soft and TV remote was broken.",
        },
    ],
    "central-sydney": [
        {
            "days_ago": 1,
            "reviewer_name": "William J. (Sample)",
            "reviewer_country": "Australia",
            "room_type": "Executive Queen Room",
            "stay_duration": "2 nights",
            "rating": 7.6,
            "title": "Very central location near CBD and light rail",
            "positive_text": "Walked everywhere in Central Sydney. Clean sheets and helpful check-in instructions.",
            "negative_text": "Traffic noise from the main road early in the morning.",
        },
        {
            "days_ago": 3,
            "reviewer_name": "Ava P. (Sample)",
            "reviewer_country": "Ireland",
            "room_type": "Standard Twin Room",
            "stay_duration": "3 nights",
            "rating": 4.2,
            "title": "Check-in lockbox confusion and dusty aircon",
            "positive_text": "Walking distance to Central station.",
            "negative_text": "Self check-in keycard was missing from the lockbox and nobody answered the phone for 30 minutes. Air conditioning filter was dusty and room condition was poor.",
        },
        {
            "days_ago": 5,
            "reviewer_name": "Henry K. (Sample)",
            "reviewer_country": "Australia",
            "room_type": "Executive Queen Room",
            "stay_duration": "1 night",
            "rating": 8.5,
            "title": "Clean, affordable overnight stay",
            "positive_text": "Great value for money right in the city center. Spotless bathroom and comfortable bed.",
            "negative_text": None,
        },
        {
            "days_ago": 7,
            "reviewer_name": "Ella R. (Sample)",
            "reviewer_country": "Singapore",
            "room_type": "Family Studio",
            "stay_duration": "4 nights",
            "rating": 4.9,
            "title": "Noisy nights and slow Wi-Fi",
            "positive_text": "Spacious family studio layout and close to buses.",
            "negative_text": "Loud sirens and street noise every night because windows are not soundproof. Wi-Fi internet was too slow for video calls.",
        },
        {
            "days_ago": 10,
            "reviewer_name": "Alexander M. (Sample)",
            "reviewer_country": "United Kingdom",
            "room_type": "Executive Queen Room",
            "stay_duration": "2 nights",
            "rating": 8.3,
            "title": "Solid central hotel with friendly housekeeping",
            "positive_text": "Housekeeping staff were polite and kept the room very clean. Good price for Central Sydney.",
            "negative_text": "Elevator was out of service for an hour.",
        },
        {
            "days_ago": 12,
            "reviewer_name": "Harper T. (Sample)",
            "reviewer_country": "Australia",
            "room_type": "Standard Double",
            "stay_duration": "2 nights",
            "rating": 8.1,
            "title": "Convenient and clean city stopover",
            "positive_text": "Easy walk to train and light rail, clean towels and good water pressure.",
            "negative_text": None,
        },
        {
            "days_ago": 18,
            "reviewer_name": "Sebastian L. (Sample)",
            "reviewer_country": "Germany",
            "room_type": "Standard Twin Room",
            "stay_duration": "3 nights",
            "rating": 6.4,
            "title": "Okay for a short budget trip",
            "positive_text": "Central location and fair price.",
            "negative_text": "Carpet had a few stains and walls were thin.",
        },
        {
            "days_ago": 25,
            "reviewer_name": "Evelyn C. (Sample)",
            "reviewer_country": "Canada",
            "room_type": "Family Studio",
            "stay_duration": "3 nights",
            "rating": 8.4,
            "title": "Spacious room and helpful front desk",
            "positive_text": "Staff arranged extra pillows quickly, room was clean and kitchen microwave was convenient.",
            "negative_text": None,
        },
    ],
    "darling-harbour": [
        {
            "days_ago": 1,
            "reviewer_name": "Benjamin W. (Sample)",
            "reviewer_country": "Australia",
            "room_type": "Harbour View Queen",
            "stay_duration": "2 nights",
            "rating": 9.4,
            "title": "Exceptional stay steps from Darling Harbour",
            "positive_text": "Unbeatable location near Darling Harbour and ICC. Room was spotless, modern renovated bathroom, and staff were genuinely attentive.",
            "negative_text": None,
        },
        {
            "days_ago": 2,
            "reviewer_name": "Scarlett H. (Sample)",
            "reviewer_country": "United States",
            "room_type": "Superior King Suite",
            "stay_duration": "3 nights",
            "rating": 9.1,
            "title": "Spacious suite, quiet sleep, and fast check-in",
            "positive_text": "Very quiet soundproof windows, luxurious mattress, spotless housekeeping, and smooth check-in.",
            "negative_text": "Parking nearby was slightly expensive.",
        },
        {
            "days_ago": 4,
            "reviewer_name": "Leo V. (Sample)",
            "reviewer_country": "New Zealand",
            "room_type": "Standard Queen Room",
            "stay_duration": "2 nights",
            "rating": 5.2,
            "title": "Aircon maintenance issue and high weekend rate",
            "positive_text": "Great location right by Darling Harbour restaurants.",
            "negative_text": "Air conditioning unit leaked water onto the carpet and maintenance took until evening to fix it. Felt overpriced for the inconvenience.",
        },
        {
            "days_ago": 6,
            "reviewer_name": "Victoria Y. (Sample)",
            "reviewer_country": "Singapore",
            "room_type": "Harbour View Queen",
            "stay_duration": "4 nights",
            "rating": 8.9,
            "title": "Wonderful harbourside base for business travel",
            "positive_text": "Fast Wi-Fi, clean desk area, polite concierge staff, and 5-minute walk to convention centre.",
            "negative_text": None,
        },
        {
            "days_ago": 8,
            "reviewer_name": "Samuel Q. (Sample)",
            "reviewer_country": "Australia",
            "room_type": "Standard Queen Room",
            "stay_duration": "2 nights",
            "rating": 8.5,
            "title": "Clean, comfortable and great facilities",
            "positive_text": "Everything was clean and well maintained. Good shower water pressure and comfy pillows.",
            "negative_text": None,
        },
        {
            "days_ago": 11,
            "reviewer_name": "Aria Z. (Sample)",
            "reviewer_country": "United Kingdom",
            "room_type": "Superior King Suite",
            "stay_duration": "3 nights",
            "rating": 8.7,
            "title": "Highly recommend for Darling Harbour visits",
            "positive_text": "Staff were welcoming, check-in took two minutes, and the room was spotless.",
            "negative_text": "Street music on Friday night was mildly noticeable.",
        },
        {
            "days_ago": 15,
            "reviewer_name": "David E. (Sample)",
            "reviewer_country": "Australia",
            "room_type": "Compact Double",
            "stay_duration": "1 night",
            "rating": 4.9,
            "title": "Bathroom cleanliness below expectation",
            "positive_text": "Location close to waterfront.",
            "negative_text": "Found hair in the bathroom sink and dusty shelves on arrival. Reception staff apologized but housekeeping had already left.",
        },
        {
            "days_ago": 22,
            "reviewer_name": "Natalie B. (Sample)",
            "reviewer_country": "Canada",
            "room_type": "Harbour View Queen",
            "stay_duration": "3 nights",
            "rating": 9.0,
            "title": "Great value and super clean room",
            "positive_text": "Clean linen, quiet aircon, helpful team, and easy walk to Barangaroo and Darling Harbour.",
            "negative_text": None,
        },
    ],
}


def seed_sample_reviews(
    db: Session,
    property_slug: Optional[str] = None,
    reference_today: Optional[date] = None,
) -> Dict[str, int]:
    """
    Idempotently seed explicitly labelled sample reviews (`is_sample_data=True`,
    `data_source='sample_seed'`) across all 4 Azzurro Hotels properties (or a single property).
    """
    today = reference_today or datetime.now(timezone.utc).date()
    query = db.query(Property)
    if property_slug:
        query = query.filter(Property.slug == property_slug)
    properties = query.all()

    total_found = 0
    total_inserted = 0
    total_duplicated = 0

    for prop in properties:
        sample_list = SAMPLE_REVIEWS_BY_SLUG.get(prop.slug, [])
        started = datetime.now(timezone.utc)
        prop_inserted = 0
        prop_duplicated = 0

        for idx, item in enumerate(sample_list):
            total_found += 1
            rev_date = today - timedelta(days=int(item["days_ago"]))
            ext_id = f"sample-{prop.slug}-{idx + 1}"
            dedup_hash = compute_review_dedup_hash(
                property_id=prop.id,
                reviewer_name=item["reviewer_name"],
                review_date=rev_date,
                title=item.get("title"),
                positive_text=item.get("positive_text"),
                negative_text=item.get("negative_text"),
                external_review_id=ext_id,
            )

            existing = db.query(Review).filter(Review.dedup_hash == dedup_hash).first()
            if existing:
                total_duplicated += 1
                prop_duplicated += 1
                continue

            full_text = " ".join(
                part
                for part in [item.get("title"), item.get("positive_text"), item.get("negative_text")]
                if part
            )
            sentiment = classify_sentiment(
                rating=float(item["rating"]),
                positive_text=item.get("positive_text"),
                negative_text=item.get("negative_text"),
                full_text=full_text,
            )
            topics, negative_topics = classify_topics(
                sentiment=sentiment,
                title=item.get("title"),
                positive_text=item.get("positive_text"),
                negative_text=item.get("negative_text"),
                full_text=full_text,
            )

            review = Review(
                property_id=prop.id,
                external_review_id=ext_id,
                dedup_hash=dedup_hash,
                reviewer_name=item["reviewer_name"],
                reviewer_country=item.get("reviewer_country"),
                room_type=item.get("room_type"),
                stay_duration=item.get("stay_duration"),
                stay_date=rev_date.strftime("%B %Y"),
                review_date=rev_date,
                rating=float(item["rating"]),
                title=item.get("title"),
                positive_text=item.get("positive_text"),
                negative_text=item.get("negative_text"),
                full_text=full_text,
                sentiment=sentiment,
                topics=topics,
                negative_topics=negative_topics,
                is_sample_data=True,
                data_source="sample_seed",
            )
            db.add(review)
            total_inserted += 1
            prop_inserted += 1

        log_entry = CollectionLog(
            property_id=prop.id,
            started_at=started,
            completed_at=datetime.now(timezone.utc),
            status="sample_fallback",
            reviews_found=len(sample_list),
            reviews_inserted=prop_inserted,
            reviews_duplicated=prop_duplicated,
            error_type=None,
            error_message="Explicitly labelled sample dataset seeded for demonstration/fallback.",
            used_sample_fallback=True,
        )
        db.add(log_entry)

    db.commit()
    return {
        "reviews_found": total_found,
        "reviews_inserted": total_inserted,
        "reviews_duplicated": total_duplicated,
    }
