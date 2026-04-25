from datetime import datetime
from zoneinfo import ZoneInfo

from app.config import get_settings
from app.models.context import ContextState, TimeBucket
from app.services.weather import get_weather
from app.services.events import get_nearby_events
from app.services.demand import get_zone_demand
from app.services.location import find_zone, get_nearby_pois


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


async def assemble_context(
    lat: float, lng: float, city: str | None = None, radius_km: float = 5.0
) -> ContextState:
    """Build the full context state from all signal sources."""
    settings = get_settings()
    tz = ZoneInfo(settings.default_timezone)
    now = datetime.now(tz)
    city = city or settings.default_city
    time_bucket = _get_time_bucket(now.hour)

    weather = await get_weather(city=city, lat=lat, lng=lng)
    zone = find_zone(lat, lng)
    events = await get_nearby_events(lat, lng, radius_km=radius_km, city=city)
    pois = await get_nearby_pois(lat, lng)

    demand = []
    if zone:
        demand = await get_zone_demand(zone.merchant_ids, time_bucket)

    return ContextState(
        weather=weather,
        time_bucket=time_bucket,
        day_of_week=now.strftime("%A").lower(),
        local_time=now.strftime("%H:%M"),
        zone=zone,
        events=events,
        pois=pois,
        demand=demand,
    )
