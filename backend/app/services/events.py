import json
import logging
from pathlib import Path

import httpx

from app.config import get_settings
from app.models.context import EventInfo

logger = logging.getLogger(__name__)


DATA_DIR = Path(__file__).resolve().parents[1] / "data"
EVENTS_FILE = DATA_DIR / "events_stub.json"


async def get_nearby_events(
    lat: float, lng: float, radius_km: float = 5.0, city: str | None = None
) -> list[EventInfo]:
    """Fetch nearby events via Tavily search, falling back to local demo data."""
    settings = get_settings()
    city = city or settings.default_city
    radius_km = max(0.1, min(radius_km, 25.0))

    if settings.tavily_api_key:
        events = await _tavily_events(city, lat, lng, radius_km)
        if events:
            return events

    return _stub_events(radius_km)


async def _tavily_events(
    city: str, lat: float, lng: float, radius_km: float
) -> list[EventInfo]:
    settings = get_settings()
    query = (
        f"local events today near {city} within {radius_km:g} km "
        f"festivals sports concerts markets latitude {lat} longitude {lng}"
    )
    payload = {
        "api_key": settings.tavily_api_key,
        "query": query,
        "search_depth": "basic",
        "max_results": 5,
        "include_answer": False,
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post("https://api.tavily.com/search", json=payload)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError:
        logger.exception("Tavily events request failed; using stub events")
        return []
    except ValueError:
        logger.exception("Tavily events response was not valid JSON")
        return []

    events: list[EventInfo] = []
    for idx, result in enumerate(data.get("results", []), start=1):
        title = result.get("title") or "Local event"
        content = result.get("content") or ""
        events.append(
            EventInfo(
                event_id=f"tavily-{idx}",
                name=title[:120],
                venue=city,
                start_time="today",
                distance_km=round(min(radius_km, 0.5 + idx * 0.4), 1),
                category=_infer_category(f"{title} {content}"),
                source="tavily",
                url=result.get("url", ""),
            )
        )

    return events


def _stub_events(radius_km: float) -> list[EventInfo]:
    try:
        raw_events = json.loads(EVENTS_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        raw_events = []

    events = [
        EventInfo(**event, source="stub")
        for event in raw_events
        if event.get("distance_km", 0) <= radius_km
    ]
    return sorted(events, key=lambda event: event.distance_km)


def _infer_category(text: str) -> str:
    lower = text.lower()
    if any(word in lower for word in ("concert", "music", "festival", "jazz")):
        return "music"
    if any(word in lower for word in ("football", "soccer", "sports", "match")):
        return "sports"
    if any(word in lower for word in ("market", "food", "restaurant")):
        return "market"
    return "local"
