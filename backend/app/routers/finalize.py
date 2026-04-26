import uuid
from datetime import datetime, timedelta
from typing import Any
from zoneinfo import ZoneInfo

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.finalize import FinalizeRequest, FinalizeResponse
from app.models.offer import GeneratedOffer, OfferVisuals
from app.repositories import merchant_repository, offer_repository
from app.dependencies import get_db_session

router = APIRouter(prefix="/v1/offers", tags=["mobile-finalize"])

MIN_VALIDITY_MINUTES = 5
MAX_VALIDITY_MINUTES = 120
SENSITIVE_KEYS = {
    "lat",
    "lng",
    "latitude",
    "longitude",
    "location",
    "movement_signature",
    "preference_hints",
}


@router.post("/finalize", response_model=FinalizeResponse)
async def finalize_offer(req: FinalizeRequest, db: Session = Depends(get_db_session)):
    _reject_sensitive_keys(req.model_dump(mode="json"))

    merchant = merchant_repository.get_merchant(db, req.merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    if not merchant.active:
        raise HTTPException(status_code=400, detail="Merchant is inactive")

    settings = get_settings()
    now = datetime.now(ZoneInfo(settings.default_timezone))
    trace_id = f"trace-{uuid.uuid4().hex[:12]}"
    offer_id = f"offer-{uuid.uuid4().hex[:8]}"
    discount_pct = min(
        req.local_model_output.discount_pct,
        merchant.rules.max_discount_pct,
    )
    validity_minutes = _clamp(
        req.local_model_output.validity_minutes,
        MIN_VALIDITY_MINUTES,
        MAX_VALIDITY_MINUTES,
    )
    expires_at = now + timedelta(minutes=validity_minutes)
    gen_ui = _build_gen_ui(req, discount_pct, validity_minutes)

    offer = GeneratedOffer(
        offer_id=offer_id,
        merchant_id=merchant.merchant_id,
        merchant_name=merchant.name,
        headline=req.local_model_output.headline,
        body=req.local_model_output.body,
        discount_pct=discount_pct,
        discount_text=f"{discount_pct:g}% off",
        valid_minutes=validity_minutes,
        product_category=merchant.rules.product_categories[0]
        if merchant.rules.product_categories
        else merchant.category or "general",
        visuals=_build_visuals(gen_ui),
        created_at=now.isoformat(),
        expires_at=expires_at.isoformat(),
    )
    offer_repository.save_offer(db, offer)

    return FinalizeResponse(
        trace_id=trace_id,
        offer_id=offer.offer_id,
        headline=offer.headline,
        body=offer.body,
        discount_pct=offer.discount_pct,
        validity_minutes=offer.valid_minutes,
        valid_until=offer.expires_at,
        gen_ui=gen_ui,
    )


def _clamp(value: int, min_value: int, max_value: int) -> int:
    return max(min_value, min(value, max_value))


def _reject_sensitive_keys(node: Any, path: str = "body") -> None:
    if isinstance(node, dict):
        for key, value in node.items():
            if key.lower() in SENSITIVE_KEYS:
                raise HTTPException(
                    status_code=422,
                    detail=f"Sensitive field is not allowed in finalize payload: {path}.{key}",
                )
            _reject_sensitive_keys(value, f"{path}.{key}")
    elif isinstance(node, list):
        for idx, value in enumerate(node):
            _reject_sensitive_keys(value, f"{path}[{idx}]")


def _build_gen_ui(
    req: FinalizeRequest,
    discount_pct: float,
    validity_minutes: int,
) -> dict[str, Any]:
    draft = req.gen_ui_draft.model_dump(exclude_none=True) if req.gen_ui_draft else {}
    color_palette = draft.get("color_palette") or {}

    return {
        "badge_text": draft.get("badge_text", "On-device draft"),
        "image_prompt": draft.get("image_prompt", ""),
        "color_palette": color_palette,
        "policy": {
            "discount_pct": discount_pct,
            "validity_minutes": validity_minutes,
            "source": "phone_slm_backend_clamped",
        },
        "coarse_context": req.coarse_context.model_dump(),
        "intent_summary": req.intent_summary,
    }


def _build_visuals(gen_ui: dict[str, Any]) -> OfferVisuals:
    color_palette = gen_ui.get("color_palette")
    if not isinstance(color_palette, dict):
        color_palette = {}

    return OfferVisuals(
        primary_color=color_palette.get("primary") or "#4F46E5",
        accent_color=color_palette.get("secondary") or "#F59E0B",
        mood="phone_slm",
        image_prompt=gen_ui.get("image_prompt") or "",
    )
