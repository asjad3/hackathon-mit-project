from fastapi import APIRouter, HTTPException

from app.models.redemption import (
    RedemptionToken,
    ValidateTokenRequest,
    ValidateTokenResponse,
    RedemptionRecord,
)
from app.services import redemption as redemption_service
from app.routers.offers import _offers
from app.models.offer import OfferStatus

router = APIRouter(prefix="/api/redemption", tags=["redemption"])


@router.post("/accept/{offer_id}", response_model=RedemptionToken)
async def accept_offer(offer_id: str):
    offer = _offers.get(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if offer.status not in (OfferStatus.GENERATED, OfferStatus.VIEWED):
        raise HTTPException(status_code=400, detail=f"Offer cannot be accepted (status: {offer.status})")

    offer.status = OfferStatus.ACCEPTED
    token = await redemption_service.create_token(offer_id, offer.merchant_id, offer.discount_pct)
    return token


@router.post("/validate", response_model=ValidateTokenResponse)
async def validate_redemption(req: ValidateTokenRequest):
    result = await redemption_service.validate_token(req.token_id, req.merchant_id)
    return result


@router.get("/history", response_model=list[RedemptionRecord])
async def get_history(merchant_id: str):
    return await redemption_service.get_merchant_redemptions(merchant_id)
