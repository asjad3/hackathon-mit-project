from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "City Wallet"
    debug: bool = True

    openweather_api_key: str = ""
    anthropic_api_key: str = ""
    eventbrite_api_key: str = ""

    default_city: str = "Munich"
    default_lat: float = 48.1351
    default_lng: float = 11.5820
    default_timezone: str = "Europe/Berlin"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
