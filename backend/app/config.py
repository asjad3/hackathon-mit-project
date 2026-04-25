from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "City Wallet"
    debug: bool = False
    app_api_key: str = ""
    cors_allowed_origins: str = "http://localhost:3000,http://localhost:5173,http://localhost:8080"

    openweather_api_key: str = ""
    tavily_api_key: str = ""

    default_city: str = "Munich"
    default_lat: float = 48.1351
    default_lng: float = 11.5820
    default_timezone: str = "Europe/Berlin"
    osm_user_agent: str = "city-wallet-hackathon/0.1"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_allowed_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    return Settings()
