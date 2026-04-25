from fastapi import APIRouter, Query

from app.config import get_settings
from app.models.context import ContextState, WeatherContext, EventInfo, MerchantDemand, POIInfo
from app.services.context_engine import assemble_context
from app.services.weather import get_weather
from app.services.events import get_nearby_events
from app.services.demand import get_merchant_demand
from app.services.location import get_nearby_pois

router = APIRouter(prefix="/api/context", tags=["context"])


@router.get("", response_model=ContextState)
async def get_full_context(
    lat: float = Query(default=None),
    lng: float = Query(default=None),
    city: str = Query(default=None),
    radius_km: float = Query(default=5.0),
):
    settings = get_settings()
    lat = lat if lat is not None else settings.default_lat
    lng = lng if lng is not None else settings.default_lng
    return await assemble_context(lat, lng, city=city, radius_km=radius_km)


@router.get("/weather", response_model=WeatherContext)
async def get_weather_context(
    city: str = Query(default=None),
    lat: float = Query(default=None),
    lng: float = Query(default=None),
):
    return await get_weather(city=city, lat=lat, lng=lng)


@router.get("/events", response_model=list[EventInfo])
async def get_events(
    lat: float = Query(default=None),
    lng: float = Query(default=None),
    radius_km: float = Query(default=5.0),
    city: str = Query(default=None),
):
    settings = get_settings()
    lat = lat if lat is not None else settings.default_lat
    lng = lng if lng is not None else settings.default_lng
    return await get_nearby_events(lat, lng, radius_km, city=city)


@router.get("/pois", response_model=list[POIInfo])
async def get_pois(
    lat: float = Query(default=None),
    lng: float = Query(default=None),
    radius_m: int = Query(default=600),
):
    settings = get_settings()
    lat = lat if lat is not None else settings.default_lat
    lng = lng if lng is not None else settings.default_lng
    return await get_nearby_pois(lat, lng, radius_m)


@router.get("/demand/{merchant_id}", response_model=MerchantDemand)
async def get_demand(merchant_id: str):
    return await get_merchant_demand(merchant_id)
