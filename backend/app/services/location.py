import json
import math
from pathlib import Path

import httpx

from app.config import get_settings
from app.models.context import LocationZone, POIInfo


DATA_DIR = Path(__file__).resolve().parents[1] / "data"
ZONES_FILE = DATA_DIR / "zones.json"
POIS_FILE = DATA_DIR / "pois_stub.json"


def distance_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates using the haversine formula."""
    earth_radius_km = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lng / 2) ** 2
    )
    return earth_radius_km * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def find_zone(lat: float, lng: float) -> LocationZone | None:
    """Match lat/lng to the closest configured zone within its radius."""
    zones = _load_json(ZONES_FILE)
    matches: list[LocationZone] = []

    for zone in zones:
        distance_m = distance_km(lat, lng, zone["lat"], zone["lng"]) * 1000
        if distance_m <= zone.get("radius_m", 500):
            matches.append(LocationZone(**zone, distance_m=round(distance_m, 1)))

    if not matches:
        return None

    return min(matches, key=lambda zone: zone.distance_m)


async def get_nearby_pois(
    lat: float, lng: float, radius_m: int = 600, category: str = "cafe"
) -> list[POIInfo]:
    """Fetch nearby POIs from OSM Overpass, falling back to local demo data."""
    pois = await _overpass_pois(lat, lng, radius_m, category)
    if pois:
        return pois
    return _stub_pois(lat, lng, radius_m)


async def _overpass_pois(
    lat: float, lng: float, radius_m: int, category: str
) -> list[POIInfo]:
    settings = get_settings()
    amenity_filter = {
        "cafe": '["amenity"~"cafe|restaurant|bar|pub"]',
        "retail": '["shop"]',
        "all": '["amenity"~"cafe|restaurant|bar|pub"]["name"]',
    }.get(category, '["amenity"~"cafe|restaurant|bar|pub"]')

    query = f"""
    [out:json][timeout:8];
    (
      node{amenity_filter}(around:{radius_m},{lat},{lng});
      way{amenity_filter}(around:{radius_m},{lat},{lng});
    );
    out center tags 10;
    """

    headers = {"User-Agent": settings.osm_user_agent}
    try:
        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            resp = await client.post(
                "https://overpass-api.de/api/interpreter", data={"data": query}
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError:
        return []

    pois: list[POIInfo] = []
    for element in data.get("elements", []):
        tags = element.get("tags", {})
        name = tags.get("name")
        if not name:
            continue
        poi_lat = element.get("lat") or element.get("center", {}).get("lat")
        poi_lng = element.get("lon") or element.get("center", {}).get("lon")
        if poi_lat is None or poi_lng is None:
            continue

        distance = distance_km(lat, lng, poi_lat, poi_lng)
        pois.append(
            POIInfo(
                poi_id=f"osm-{element.get('type')}-{element.get('id')}",
                name=name,
                category=tags.get("amenity") or tags.get("shop") or "poi",
                distance_km=round(distance, 2),
                lat=poi_lat,
                lng=poi_lng,
                source="osm",
            )
        )

    return sorted(pois, key=lambda poi: poi.distance_km)[:10]


def _stub_pois(lat: float, lng: float, radius_m: int) -> list[POIInfo]:
    raw_pois = _load_json(POIS_FILE)
    pois: list[POIInfo] = []

    for poi in raw_pois:
        distance = distance_km(lat, lng, poi["lat"], poi["lng"])
        if distance * 1000 <= radius_m:
            pois.append(POIInfo(**poi, distance_km=round(distance, 2), source="stub"))

    return sorted(pois, key=lambda poi: poi.distance_km)


def _load_json(path: Path) -> list[dict]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
