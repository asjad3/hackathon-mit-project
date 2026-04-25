from fastapi import APIRouter, Depends, HTTPException

from app.dependencies import require_api_key
from app.models.merchant import Merchant, MerchantRules, MerchantDashboard
from app.models.offer import OfferStatus
from app.repositories import merchant_repository, offer_repository, redemption_repository

router = APIRouter(prefix="/api/merchants", tags=["merchants"])


@router.get("", response_model=list[Merchant])
async def list_merchants():
    return merchant_repository.list_merchants()


@router.get("/{merchant_id}", response_model=Merchant)
async def get_merchant(merchant_id: str):
    merchant = merchant_repository.get_merchant(merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return merchant


@router.get("/{merchant_id}/rules", response_model=MerchantRules)
async def get_merchant_rules(merchant_id: str):
    merchant = merchant_repository.get_merchant(merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return merchant.rules


@router.put(
    "/{merchant_id}/rules",
    response_model=Merchant,
    dependencies=[Depends(require_api_key)],
)
async def update_merchant_rules(merchant_id: str, rules: MerchantRules):
    merchant = merchant_repository.update_merchant_rules(merchant_id, rules)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return merchant


@router.get("/{merchant_id}/dashboard", response_model=MerchantDashboard)
async def get_merchant_dashboard(merchant_id: str):
    merchant = merchant_repository.get_merchant(merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    merchant_offers = [
        offer
        for offer in offer_repository.list_offers()
        if offer.merchant_id == merchant_id
    ]
    accepted = [
        offer
        for offer in merchant_offers
        if offer.status in (OfferStatus.ACCEPTED, OfferStatus.REDEEMED)
    ]
    records = redemption_repository.list_records_for_merchant(merchant_id)
    total_offers = len(merchant_offers)
    total_accepted = len(accepted)
    total_redeemed = len(records)

    return MerchantDashboard(
        merchant_id=merchant_id,
        name=merchant.name,
        total_offers_generated=total_offers,
        total_accepted=total_accepted,
        total_redeemed=total_redeemed,
        total_discount_eur=round(
            sum(record.discount_applied_eur for record in records), 2
        ),
        acceptance_rate=round(total_accepted / total_offers, 4)
        if total_offers
        else 0.0,
        redemption_rate=round(total_redeemed / total_accepted, 4)
        if total_accepted
        else 0.0,
    )
