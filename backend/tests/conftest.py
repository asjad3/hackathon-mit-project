import sys
import tempfile
import os
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


@pytest.fixture(scope="function")
def test_db_session():
    """Create a temporary test database for each test function."""
    from app.database.db import Base
    
    # Create a temporary database file
    db_file = tempfile.NamedTemporaryFile(delete=False, suffix=".db")
    db_file.close()
    
    # Create engine for test database
    test_engine = create_engine(
        f"sqlite:///{db_file.name}",
        connect_args={"check_same_thread": False},
    )
    
    # Create all tables
    Base.metadata.create_all(bind=test_engine)
    
    # Create session
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Clean up test database file
        try:
            os.unlink(db_file.name)
        except OSError:
            pass


@pytest.fixture(scope="function")
def client(test_db_session):
    """Create a TestClient with overridden database dependency."""
    from app.main import app
    from app.dependencies import get_db_session
    from fastapi import Depends
    
    # Override the get_db_session dependency
    def override_get_db_session():
        try:
            yield test_db_session
        finally:
            pass
    
    app.dependency_overrides[get_db_session] = override_get_db_session
    
    yield TestClient(app, raise_server_exceptions=False)
    
    # Clean up override
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def reset_database_state(test_db_session):
    """Reset database state and stub external services for each test."""
    from app.config import get_settings
    from app.database.models import Merchant
    from app.repositories import (
        merchant_repository,
        offer_repository,
        redemption_repository,
    )
    from app.models.context import WeatherCondition, WeatherContext
    from app.services import context_engine
    from app.database.seed import seed_merchants

    async def stub_weather(city: str | None = None, lat: float | None = None, lng: float | None = None):
        return WeatherContext(
            condition=WeatherCondition.CLOUDS,
            description="test weather",
            temp_c=11,
            feels_like_c=9,
            humidity=70,
            city=city or "Munich",
            source="stub",
        )

    async def stub_events(lat: float, lng: float, radius_km: float = 5.0, city: str | None = None):
        return []

    async def stub_pois(lat: float, lng: float, radius_m: int = 600, category: str = "cafe"):
        return []

    get_settings.cache_clear()
    
    # Reset database tables
    test_db_session.query(Merchant).delete()
    test_db_session.commit()
    
    # Seed merchants from JSON
    seed_merchants(test_db_session)
    
    # Reset other repositories (they will use the test DB session)
    offer_repository.reset_offers(test_db_session)
    redemption_repository.reset_redemptions(test_db_session)
    
    # Stub external services
    context_engine.get_weather = stub_weather
    context_engine.get_nearby_events = stub_events
    context_engine.get_nearby_pois = stub_pois

    yield

    get_settings.cache_clear()


@pytest.fixture
def db_session(test_db_session):
    """Provide database session for tests."""
    yield test_db_session
