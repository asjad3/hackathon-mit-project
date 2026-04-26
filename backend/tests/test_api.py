from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app
from app.repositories import merchant_repository, redemption_repository
from app.services import redemption as redemption_service

client = TestClient(app, raise_server_exceptions=False)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_context_defaults_to_supported_zone():
    response = client.get("/api/context")

    assert response.status_code == 200
    body = response.json()
    assert body["weather"]["source"] == "stub"
    assert body["zone"]["zone_id"] == "zone-altstadt"
    assert isinstance(body["demand"], list)


def test_context_rejects_oversized_poi_radius():
    response = client.get("/api/context/pois", params={"radius_m": 5001})

    assert response.status_code == 422


def test_offer_generation_and_fetch():
    response = client.post(
        "/api/offers/generate",
        json={"lat": 48.1351, "lng": 11.5761, "user_id": "test-user"},
    )

    assert response.status_code == 200
    offer = response.json()
    assert offer["offer_id"].startswith("offer-")
    assert offer["merchant_id"] in {"cafe-luna", "pizza-roma", "bookstore-page1"}

    fetched = client.get(f"/api/offers/{offer['offer_id']}")
    assert fetched.status_code == 200
    assert fetched.json()["offer_id"] == offer["offer_id"]


def test_offer_generation_returns_404_outside_zone():
    response = client.post(
        "/api/offers/generate",
        json={"lat": 52.52, "lng": 13.405, "user_id": "test-user"},
    )

    assert response.status_code == 404


@pytest.mark.parametrize(
    "lat,lng,city,expected_zone_id",
    [
        (33.6844, 73.0479, "Islamabad", "zone-islamabad"),
        (31.49, 74.32, "Lahore", "zone-lahore"),
        (24.89, 66.99, "Karachi", "zone-karachi"),
        (30.17, 71.52, "Multan", "zone-multan"),
    ],
)
def test_pakistan_context_resolves_zone_and_generates_offer(
    lat, lng, city, expected_zone_id
):
    ctx = client.get(
        "/api/context", params={"lat": lat, "lng": lng, "city": city, "radius_km": 5}
    )
    assert ctx.status_code == 200
    body = ctx.json()
    assert body["zone"] is not None
    assert body["zone"]["zone_id"] == expected_zone_id
    zone_merchant_ids = set(body["zone"]["merchant_ids"])

    offer_resp = client.post(
        "/api/offers/generate",
        json={"lat": lat, "lng": lng, "user_id": f"pk-smoke-{city}"},
    )
    assert offer_resp.status_code == 200
    offer = offer_resp.json()
    assert offer["merchant_id"] in zone_merchant_ids
    assert offer["merchant_name"]
    assert offer["offer_id"].startswith("offer-")


def test_accept_validate_history_and_dashboard():
    rules_response = client.put(
        "/api/merchants/cafe-luna/rules",
        json={
            "max_discount_pct": 20,
            "goal": "fill_quiet_hours",
            "quiet_hours": ["14:00-17:00"],
            "budget_daily_eur": 50,
            "product_categories": ["coffee", "pastries"],
            "min_order_eur": 20,
        },
    )
    assert rules_response.status_code == 200

    offer_response = client.post(
        "/api/offers/generate",
        json={"lat": 48.1351, "lng": 11.5761, "user_id": "test-user"},
    )
    offer = offer_response.json()

    token_response = client.post(f"/api/redemption/accept/{offer['offer_id']}")
    assert token_response.status_code == 200
    token = token_response.json()
    chosen = merchant_repository.get_merchant(offer["merchant_id"])
    min_eur = chosen.rules.min_order_eur if chosen else 0.0
    expected_discount = (
        round(min_eur * offer["discount_pct"] / 100, 2) if min_eur else 0.0
    )
    assert token["discount_eur"] == expected_discount
    assert len(token["token_id"]) > len("tok-")

    validate_response = client.post(
        "/api/redemption/validate",
        json={"token_id": token["token_id"], "merchant_id": offer["merchant_id"]},
    )
    assert validate_response.status_code == 200
    assert validate_response.json()["valid"] is True

    second_validate = client.post(
        "/api/redemption/validate",
        json={"token_id": token["token_id"], "merchant_id": offer["merchant_id"]},
    )
    assert second_validate.status_code == 200
    assert second_validate.json()["valid"] is False
    assert second_validate.json()["message"] == redemption_service.INVALID_TOKEN_MESSAGE

    history = client.get(
        "/api/redemption/history",
        params={"merchant_id": offer["merchant_id"]},
    )
    assert history.status_code == 200
    assert history.json()[0]["discount_applied_eur"] == expected_discount

    dashboard = client.get(f"/api/merchants/{offer['merchant_id']}/dashboard")
    assert dashboard.status_code == 200
    assert dashboard.json()["total_redeemed"] == 1


def test_api_key_required_when_configured(monkeypatch):
    monkeypatch.setenv("APP_API_KEY", "secret")
    get_settings.cache_clear()

    denied = client.put(
        "/api/merchants/cafe-luna/rules",
        json={
            "max_discount_pct": 15,
            "goal": "fill_quiet_hours",
            "quiet_hours": [],
            "budget_daily_eur": 50,
            "product_categories": ["coffee"],
            "min_order_eur": 0,
        },
    )
    assert denied.status_code == 401

    allowed = client.put(
        "/api/merchants/cafe-luna/rules",
        headers={"X-API-Key": "secret"},
        json={
            "max_discount_pct": 15,
            "goal": "fill_quiet_hours",
            "quiet_hours": [],
            "budget_daily_eur": 50,
            "product_categories": ["coffee"],
            "min_order_eur": 0,
        },
    )
    assert allowed.status_code == 200


def test_expired_token_cannot_be_redeemed():
    settings = get_settings()
    expires_at = (
        datetime.now(ZoneInfo(settings.default_timezone)) - timedelta(minutes=1)
    ).isoformat()
    offer = client.post(
        "/api/offers/generate",
        json={"lat": 48.1351, "lng": 11.5761, "user_id": "test-user"},
    ).json()
    expired = client.post(f"/api/redemption/accept/{offer['offer_id']}").json()
    stored = redemption_repository.get_token(expired["token_id"])
    stored.expires_at = expires_at
    redemption_repository.save_token(stored)

    response = client.post(
        "/api/redemption/validate",
        json={"token_id": expired["token_id"], "merchant_id": expired["merchant_id"]},
    )

    assert response.status_code == 200
    assert response.json()["valid"] is False
    assert response.json()["token_status"] == "expired"
