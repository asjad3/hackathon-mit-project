from pydantic import BaseModel
from enum import Enum


class TimeBucket(str, Enum):
    EARLY_MORNING = "early_morning"  # 05-08
    MORNING = "morning"              # 08-11
    LUNCH = "lunch"                  # 11-14
    AFTERNOON = "afternoon"          # 14-17
    EVENING = "evening"              # 17-21
    NIGHT = "night"                  # 21-05


class WeatherCondition(str, Enum):
    CLEAR = "clear"
    CLOUDS = "clouds"
    RAIN = "rain"
    DRIZZLE = "drizzle"
    SNOW = "snow"
    THUNDERSTORM = "thunderstorm"
    FOG = "fog"
    OTHER = "other"


class WeatherContext(BaseModel):
    condition: WeatherCondition
    description: str = ""
    temp_c: float
    feels_like_c: float = 0.0
    humidity: int = 0
    city: str = ""


class LocationZone(BaseModel):
    zone_id: str
    name: str
    lat: float
    lng: float
    radius_m: float = 500.0
    merchant_ids: list[str] = []


class EventInfo(BaseModel):
    event_id: str
    name: str
    venue: str = ""
    start_time: str = ""
    distance_km: float = 0.0
    category: str = ""


class DemandLevel(str, Enum):
    VERY_LOW = "very_low"
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    VERY_HIGH = "very_high"


class MerchantDemand(BaseModel):
    merchant_id: str
    current_volume: int = 0
    avg_volume: int = 0
    level: DemandLevel = DemandLevel.NORMAL
    vs_avg_pct: float = 0.0


class ContextState(BaseModel):
    weather: WeatherContext
    time_bucket: TimeBucket
    day_of_week: str = ""
    local_time: str = ""
    zone: LocationZone | None = None
    events: list[EventInfo] = []
    demand: list[MerchantDemand] = []
