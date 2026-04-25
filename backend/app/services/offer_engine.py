import uuid
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from app.config import get_settings
from app.models.context import ContextState
from app.models.merchant import Merchant
from app.models.offer import GeneratedOffer, OfferVisuals


async def generate_offer(
    context: ContextState, merchant: Merchant
) -> GeneratedOffer:
    """Build the server-side offer contract for mobile-local model copy."""
    settings = get_settings()
    tz = ZoneInfo(settings.default_timezone)
    now = datetime.now(tz)

    offer_id = f"offer-{uuid.uuid4().hex[:8]}"
    valid_minutes = 30

    return GeneratedOffer(
        offer_id=offer_id,
        merchant_id=merchant.merchant_id,
        merchant_name=merchant.name,
        headline=f"Local offer at {merchant.name}",
        body=(
            "Use the mobile on-device model to personalize this offer from "
            "the returned context and merchant rules."
        ),
        discount_pct=min(15.0, merchant.rules.max_discount_pct),
        discount_text="15% off any hot drink",
        valid_minutes=valid_minutes,
        product_category=merchant.rules.product_categories[0]
        if merchant.rules.product_categories
        else "general",
        visuals=OfferVisuals(
            primary_color="#4F46E5",
            accent_color="#F59E0B",
            emoji="☕",
            mood="warm",
        ),
        created_at=now.isoformat(),
        expires_at=(now + timedelta(minutes=valid_minutes)).isoformat(),
    )
