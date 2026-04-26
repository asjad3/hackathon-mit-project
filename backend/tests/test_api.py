from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from app.config import get_settings
from app.repositories import merchant_repository, redemption_repository
from app.services import redemption as redemption_service


def _finalize_payload(**overrides):
    payload = {
        "session_id": "sess-test",
        "client_pseudonym": "demo-user",
        "merchant_id": "cafe-luna",
        "intent_summary": "low_slow_browse_interested",
        "coarse_context": {
            "time_bucket": "lunch",
            "weather_bucket": "rainy",
            "area_bucket": "old_town",
            "demand_bucket": "low",
            "event_tags": ["local_fair"],
        },
        "local_model_output": {
            "headline": "Warm up at Cafe Luna",
            "body": "A cozy coffee break is waiting nearby.",
            "discount_pct": 12,
            "validity_minutes": 30,
        },
        "gen_ui_draft": {
            "badge_text": "On-device draft",
            "color_palette": {"primary": "#4f46e5", "secondary": "#f59e0b"},
        },
    }
    payload.update(overrides)
    return payload


def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_context_defaults_to_supported_zone(client):
    response = client.get("/api/context")

    assert response.status_code == 200
    body = response.json()
    assert body["weather"]["source"] == "stub"
    assert body["zone"]["zone_id"] == "zone-altstadt"
    assert isinstance(body["demand"], list)


def test_context_rejects_oversized_poi_radius(client):
    response = client.get("/api/context/pois", params={"radius_m": 5001})

    assert response.status_code == 422


def test_offer_generation_and_fetch(client):
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


def test_offer_generation_returns_404_outside_zone(client):
    response = client.post(
        "/api/offers/generate",
        json={"lat": 52.52, "lng": 13.405, "user_id": "test-user"},
    )

    assert response.status_code == 404


def test_finalize_creates_offer_matching_mobile_contract(client):
    response = client.post("/v1/offers/finalize", json=_finalize_payload())

    assert response.status_code == 200
    body = response.json()
    assert body["trace_id"].startswith("trace-")
    assert body["offer_id"].startswith("offer-")
    assert body["headline"] == "Warm up at Cafe Luna"
    assert body["discount_pct"] == 12
    assert body["validity_minutes"] == 30
    assert "valid_until" in body
    assert body["gen_ui"]["badge_text"] == "On-device draft"
    assert body["gen_ui"]["policy"]["source"] == "phone_slm_backend_clamped"

    stored = client.get(f"/api/offers/{body['offer_id']}")
    assert stored.status_code == 200
    stored_offer = stored.json()
    assert stored_offer["merchant_id"] == "cafe-luna"
    assert stored_offer["headline"] == body["headline"]


def test_finalize_clamps_discount_to_merchant_rules(client):
    payload = _finalize_payload(
        local_model_output={
            "headline": "Big coffee deal",
            "body": "The phone suggested too much discount.",
            "discount_pct": 99,
            "validity_minutes": 240,
        }
    )

    response = client.post("/v1/offers/finalize", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["discount_pct"] == 20
    assert body["validity_minutes"] == 120
    assert body["gen_ui"]["policy"]["discount_pct"] == 20


def test_finalize_rejects_unknown_or_inactive_merchant(client, db_session):
    unknown = client.post(
        "/v1/offers/finalize",
        json=_finalize_payload(merchant_id="missing-merchant"),
    )
    assert unknown.status_code == 404

    from app.repositories import merchant_repository
    from app.database.models import Merchant as MerchantModel

    # Update the merchant in the database directly
    merchant = db_session.query(MerchantModel).filter(MerchantModel.merchant_id == "cafe-luna").first()
    merchant.active = False
    db_session.commit()

    inactive = client.post("/v1/offers/finalize", json=_finalize_payload())
    assert inactive.status_code == 400


def test_finalize_rejects_sensitive_fields(client):
    response = client.post(
        "/v1/offers/finalize",
        json=_finalize_payload(
            gen_ui_draft={
                "badge_text": "Bad draft",
                "color_palette": {"lat": "48.1351"},
            }
        ),
    )

    assert response.status_code == 422
    assert "Sensitive field" in response.json()["detail"]


def test_finalized_offer_can_enter_redemption_flow(client):
    finalize = client.post("/v1/offers/finalize", json=_finalize_payload())
    offer = finalize.json()

    token_response = client.post(f"/api/redemption/accept/{offer['offer_id']}")
    assert token_response.status_code == 200
    token = token_response.json()
    assert token["offer_id"] == offer["offer_id"]
    assert token["discount_pct"] == offer["discount_pct"]

    validate_response = client.post(
        "/api/redemption/validate",
        json={"token_id": token["token_id"], "merchant_id": token["merchant_id"]},
    )
    assert validate_response.status_code == 200
    assert validate_response.json()["valid"] is True
    assert validate_response.json()["offer_headline"] == offer["headline"]


def test_accept_validate_history_and_dashboard(client, db_session):
    # Update rules with min_order_eur on the merchant the offer engine is likely to pick
    # (pizza-roma is picked due to low demand; hedge by updating both)
    for mid in ("cafe-luna", "pizza-roma"):
        resp = client.put(
            f"/api/merchants/{mid}/rules",
            json={
                "max_discount_pct": 20,
                "goal": "fill_quiet_hours",
                "quiet_hours": ["14:00-17:00"],
                "budget_daily_eur": 50,
                "product_categories": ["coffee", "pastries"],
                "min_order_eur": 20,
            },
        )
        assert resp.status_code == 200

    offer_response = client.post(
        "/api/offers/generate",
        json={"lat": 48.1351, "lng": 11.5761, "user_id": "test-user"},
    )
    offer = offer_response.json()

    token_response = client.post(f"/api/redemption/accept/{offer['offer_id']}")
    assert token_response.status_code == 200
    token = token_response.json()
    chosen = merchant_repository.get_merchant(db_session, offer["merchant_id"])
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


def test_api_key_required_when_configured(client, monkeypatch):
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


def test_expired_token_cannot_be_redeemed(client, db_session):
    settings = get_settings()
    expires_at = (
        datetime.now(ZoneInfo(settings.default_timezone)) - timedelta(minutes=1)
    ).isoformat()
    offer = client.post(
        "/api/offers/generate",
        json={"lat": 48.1351, "lng": 11.5761, "user_id": "test-user"},
    ).json()
    expired = client.post(f"/api/redemption/accept/{offer['offer_id']}").json()
    stored = redemption_repository.get_token(db_session, expired["token_id"])
    stored.expires_at = expires_at
    redemption_repository.save_token(db_session, stored)

    response = client.post(
        "/api/redemption/validate",
        json={"token_id": expired["token_id"], "merchant_id": expired["merchant_id"]},
    )

    assert response.status_code == 200
    assert response.json()["valid"] is False
    assert response.json()["token_status"] == "expired"
