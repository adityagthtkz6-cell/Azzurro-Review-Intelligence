from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


DEFAULT_AZZURRO_PROPERTIES = [
    {
        "slug": "surry-hills",
        "name": "Azzurro Surry Hills (Sydney City Stay)",
        "area": "Surry Hills",
        "city": "Sydney",
        "country": "Australia",
        "booking_url": "https://www.booking.com/hotel/au/sydney-city-stay.html",
    },
    {
        "slug": "potts-point",
        "name": "Azzurro Potts Point (Venus Potts Point)",
        "area": "Potts Point",
        "city": "Sydney",
        "country": "Australia",
        "booking_url": "https://www.booking.com/hotel/au/venus-potts-point-sydney.html",
    },
    {
        "slug": "central-sydney",
        "name": "Azzurro Central Sydney (Venus Surry Hills)",
        "area": "Central Sydney",
        "city": "Sydney",
        "country": "Australia",
        "booking_url": "https://www.booking.com/hotel/au/venus-surry-hills.html",
    },
    {
        "slug": "darling-harbour",
        "name": "Azzurro Darling Harbour (Chateau de Venus)",
        "area": "Darling Harbour",
        "city": "Sydney",
        "country": "Australia",
        "booking_url": "https://www.booking.com/hotel/au/chateau-de-venus.html",
    },
]

CANONICAL_TOPICS = [
    "Cleanliness",
    "Check-in",
    "Staff",
    "Noise",
    "Facilities",
    "Location",
    "Room condition",
    "Value for money",
]


class Settings(BaseSettings):
    APP_NAME: str = "Azzurro Review Intelligence API"
    APP_ENV: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    # Primary PostgreSQL connection URL (can be overridden by DATABASE_URL in .env)
    DATABASE_URL: str = (
        "postgresql+psycopg://azzurro:azzurro_secret_change_me@127.0.0.1:5432/azzurro_reviews"
    )

    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3005,http://127.0.0.1:3005"

    COLLECTOR_HEADLESS: bool = True
    COLLECTOR_TIMEOUT_MS: int = 25000
    COLLECTOR_MAX_PAGES_PER_PROPERTY: int = 3
    COLLECTOR_MAX_RETRIES: int = 2
    COLLECTOR_USER_AGENT: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
    )
    ENABLE_SAMPLE_FALLBACK_ON_BLOCK: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
