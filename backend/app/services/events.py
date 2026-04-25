from app.models.context import EventInfo


async def get_nearby_events(
    lat: float, lng: float, radius_km: float = 5.0
) -> list[EventInfo]:
    """Fetch nearby events. Returns stub data for MVP."""
    # TODO: integrate Eventbrite API when key is available
    return _stub_events()


def _stub_events() -> list[EventInfo]:
    return [
        EventInfo(
            event_id="evt-001",
            name="City Jazz Festival",
            venue="Marienplatz",
            start_time="18:00",
            distance_km=0.3,
            category="music",
        ),
        EventInfo(
            event_id="evt-002",
            name="Farmers Market",
            venue="Viktualienmarkt",
            start_time="08:00",
            distance_km=0.8,
            category="market",
        ),
    ]
