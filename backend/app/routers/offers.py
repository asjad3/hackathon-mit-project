from fastapi import APIRouter, HTTPException

from app.models.offer import GeneratedOffer, OfferRequest
from app.services.context_engine import assemble_context
from app.services.offer_engine import generate_offer
from app.routers.merchants import _merchants

router = APIRouter(prefix="/api/offers", tags=["offers"])

_offers: dict[str, GeneratedOffer] = {}


@router.post("/generate", response_model=GeneratedOffer)
async def generate_new_offer(req: OfferRequest):
    context = await assemble_context(req.lat, req.lng)

    # Pick the best merchant (stub: first with low demand)
    target_merchant = None
    for demand in context.demand:
        if demand.level.value in ("very_low", "low"):
            merchant = _merchants.get(demand.merchant_id)
            if merchant and merchant.active:
                target_merchant = merchant
                break

    if not target_merchant:
        target_merchant = next(
            (m for m in _merchants.values() if m.active), None
        )

    if not target_merchant:
        raise HTTPException(status_code=404, detail="No active merchants in zone")

    offer = await generate_offer(context, target_merchant)
    _offers[offer.offer_id] = offer
    return offer


@router.get("/{offer_id}", response_model=GeneratedOffer)
async def get_offer(offer_id: str):
    offer = _offers.get(offer_id)
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    return offer
