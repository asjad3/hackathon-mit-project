import httpx
from app.models.context import WeatherContext, WeatherCondition
from app.config import get_settings


def _map_condition(owm_main: str) -> WeatherCondition:
    mapping = {
        "Clear": WeatherCondition.CLEAR,
        "Clouds": WeatherCondition.CLOUDS,
        "Rain": WeatherCondition.RAIN,
        "Drizzle": WeatherCondition.DRIZZLE,
        "Snow": WeatherCondition.SNOW,
        "Thunderstorm": WeatherCondition.THUNDERSTORM,
        "Mist": WeatherCondition.FOG,
        "Fog": WeatherCondition.FOG,
        "Haze": WeatherCondition.FOG,
    }
    return mapping.get(owm_main, WeatherCondition.OTHER)


async def get_weather(
    city: str | None = None, lat: float | None = None, lng: float | None = None
) -> WeatherContext:
    """Fetch current weather from OpenWeatherMap API, with a demo-safe fallback."""
    settings = get_settings()
    city = city or settings.default_city
    api_key = settings.openweather_api_key

    if not api_key:
        return _stub_weather(city)

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"appid": api_key, "units": "metric"}
    if lat is not None and lng is not None:
        params.update({"lat": lat, "lon": lng})
    else:
        params["q"] = city

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError:
        return _stub_weather(city)

    weather_main = data["weather"][0]["main"]
    return WeatherContext(
        condition=_map_condition(weather_main),
        description=data["weather"][0].get("description", ""),
        temp_c=data["main"]["temp"],
        feels_like_c=data["main"].get("feels_like", 0),
        humidity=data["main"].get("humidity", 0),
        city=data.get("name") or city,
        source="openweathermap",
    )


def _stub_weather(city: str) -> WeatherContext:
    """Fallback stub when no API key is configured."""
    return WeatherContext(
        condition=WeatherCondition.CLOUDS,
        description="overcast and slightly cold (demo fallback)",
        temp_c=11.0,
        feels_like_c=9.5,
        humidity=78,
        city=city,
        source="stub",
    )
