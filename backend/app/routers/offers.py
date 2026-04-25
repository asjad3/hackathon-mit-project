from fastapi import APIRouter, HTTPException

from app.models.offer import GeneratedOffer, OfferRequest
from app.services.context_engine import assemble_context
from app.services.offer_engine import generate_offer
from app.repositories import merchant_repository, offer_repository

router = APIRouter(prefix="/api/offers", tags=["offers"])


@router.post("/generate", response_model=GeneratedOffer)
async def generate_new_offer(req: OfferRequest):
    context = await assemble_context(req.lat, req.lng)

    if not context.zone:
        raise HTTPException(
            status_code=404,
            detail="No supported merchant zone found for this location",
        )

    zone_merchants = [
        merchant
        for merchant_id in context.zone.merchant_ids
        if (merchant := merchant_repository.get_merchant(merchant_id)) and merchant.active
    ]
    if not zone_merchants:
        raise HTTPException(
            status_code=404,
            detail="No active merchants available in this zone",
        )

    # Pick the best local merchant (stub: first with low demand, then any active zone merchant).
    target_merchant = None
    for demand in context.demand:
        if demand.level.value in ("very_low", "low"):
            merchant = merchant_repository.get_merchant(demand.merchant_id)
            if merchant in zone_merchants:
                target_merchant = merchant
                break

    if not target_merchant:
        target_merchant = zone_merchants[0]

    offer = await generate_offer(context, target_merchant)
    return offer_repository.save_offer(offer)


@router.get("/{offer_id}", response_model=GeneratedOffer)
async def get_offer(offer_id: str):
    offer = offer_repository.get_offer(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    return offer
