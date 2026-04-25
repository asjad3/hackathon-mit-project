import sys
from pathlib import Path

import pytest

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


@pytest.fixture(autouse=True)
def reset_in_memory_state(monkeypatch):
    from app.config import get_settings
    from app.repositories import (
        merchant_repository,
        offer_repository,
        redemption_repository,
    )
    from app.models.context import WeatherCondition, WeatherContext
    from app.services import context_engine

    async def stub_weather(city: str | None = None, lat: float | None = None, lng: float | None = None):
        return WeatherContext(
            condition=WeatherCondition.CLOUDS,
            description="test weather",
            temp_c=11,
            feels_like_c=9,
            humidity=70,
            city=city or "Munich",
            source="stub",
        )

    async def stub_events(lat: float, lng: float, radius_km: float = 5.0, city: str | None = None):
        return []

    async def stub_pois(lat: float, lng: float, radius_m: int = 600, category: str = "cafe"):
        return []

    monkeypatch.delenv("APP_API_KEY", raising=False)
    get_settings.cache_clear()
    merchant_repository.reset_merchants()
    offer_repository.reset_offers()
    redemption_repository.reset_redemptions()
    monkeypatch.setattr(context_engine, "get_weather", stub_weather)
    monkeypatch.setattr(context_engine, "get_nearby_events", stub_events)
    monkeypatch.setattr(context_engine, "get_nearby_pois", stub_pois)

    yield

    get_settings.cache_clear()
