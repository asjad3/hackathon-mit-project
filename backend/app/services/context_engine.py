from datetime import datetime
from zoneinfo import ZoneInfo

from app.config import get_settings
from app.models.context import ContextState, TimeBucket, LocationZone
from app.services.weather import get_weather
from app.services.events import get_nearby_events
from app.services.demand import get_zone_demand


def _get_time_bucket(hour: int) -> TimeBucket:
    if 5 <= hour < 8:
        return TimeBucket.EARLY_MORNING
    elif 8 <= hour < 11:
        return TimeBucket.MORNING
    elif 11 <= hour < 14:
        return TimeBucket.LUNCH
    elif 14 <= hour < 17:
        return TimeBucket.AFTERNOON
    elif 17 <= hour < 21:
        return TimeBucket.EVENING
    return TimeBucket.NIGHT


def _find_zone(lat: float, lng: float) -> LocationZone | None:
    """Match lat/lng to a predefined zone. Stub for MVP."""
    # TODO: load from data/zones.json and do radius matching
    return LocationZone(
        zone_id="zone-altstadt",
        name="Altstadt",
        lat=48.1371,
        lng=11.5754,
        radius_m=800,
        merchant_ids=["cafe-luna", "pizza-roma", "bookstore-page1"],
    )


async def assemble_context(lat: float, lng: float) -> ContextState:
    """Build the full context state from all signal sources."""
    settings = get_settings()
    tz = ZoneInfo(settings.default_timezone)
    now = datetime.now(tz)

    weather = await get_weather()
    zone = _find_zone(lat, lng)
    events = await get_nearby_events(lat, lng)

    demand = []
    if zone:
        demand = await get_zone_demand(zone.merchant_ids)

    return ContextState(
        weather=weather,
        time_bucket=_get_time_bucket(now.hour),
        day_of_week=now.strftime("%A").lower(),
        local_time=now.strftime("%H:%M"),
        zone=zone,
        events=events,
        demand=demand,
    )
