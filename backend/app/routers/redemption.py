from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import require_api_key, get_db_session
from app.models.redemption import (
    RedemptionToken,
    ValidateTokenRequest,
    ValidateTokenResponse,
    RedemptionRecord,
)
from app.services import redemption as redemption_service
from app.models.offer import OfferStatus
from app.repositories import merchant_repository, offer_repository

router = APIRouter(prefix="/api/redemption", tags=["redemption"])


@router.post("/accept/{offer_id}", response_model=RedemptionToken)
async def accept_offer(offer_id: str, db: Session = Depends(get_db_session)):
    offer = offer_repository.get_offer(db, offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if offer.status not in (OfferStatus.GENERATED, OfferStatus.VIEWED):
        raise HTTPException(status_code=400, detail=f"Offer cannot be accepted (status: {offer.status})")

    merchant = merchant_repository.get_merchant(db, offer.merchant_id)
    discount_eur = 0.0
    if merchant and merchant.rules.min_order_eur:
        discount_eur = round(merchant.rules.min_order_eur * offer.discount_pct / 100, 2)

    offer_repository.set_offer_status(db, offer_id, OfferStatus.ACCEPTED)
    token = await redemption_service.create_token(
        db,
        offer_id,
        offer.merchant_id,
        offer.discount_pct,
        discount_eur=discount_eur,
        expires_at=offer.expires_at,
    )
    return token


@router.post(
    "/validate",
    response_model=ValidateTokenResponse,
    dependencies=[Depends(require_api_key)],
)
async def validate_redemption(req: ValidateTokenRequest, db: Session = Depends(get_db_session)):
    result = await redemption_service.validate_token(db, req.token_id, req.merchant_id)
    return result


@router.get(
    "/history",
    response_model=list[RedemptionRecord],
    dependencies=[Depends(require_api_key)],
)
async def get_history(merchant_id: str, db: Session = Depends(get_db_session)):
    return await redemption_service.get_merchant_redemptions(db, merchant_id)
