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


async def get_weather(city: str | None = None) -> WeatherContext:
    """Fetch current weather from OpenWeatherMap API."""
    settings = get_settings()
    city = city or settings.default_city
    api_key = settings.openweather_api_key

    if not api_key:
        return _stub_weather(city)

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"q": city, "appid": api_key, "units": "metric"}

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    weather_main = data["weather"][0]["main"]
    return WeatherContext(
        condition=_map_condition(weather_main),
        description=data["weather"][0].get("description", ""),
        temp_c=data["main"]["temp"],
        feels_like_c=data["main"].get("feels_like", 0),
        humidity=data["main"].get("humidity", 0),
        city=city,
    )


def _stub_weather(city: str) -> WeatherContext:
    """Fallback stub when no API key is configured."""
    return WeatherContext(
        condition=WeatherCondition.RAIN,
        description="light rain (stub)",
        temp_c=12.0,
        feels_like_c=10.0,
        humidity=78,
        city=city,
    )
