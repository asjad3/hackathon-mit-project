from pydantic import BaseModel
from enum import Enum


class OfferStatus(str, Enum):
    GENERATED = "generated"
    VIEWED = "viewed"
    ACCEPTED = "accepted"
    REDEEMED = "redeemed"
    EXPIRED = "expired"
    DECLINED = "declined"


class OfferVisuals(BaseModel):
    primary_color: str = "#4F46E5"
    accent_color: str = "#F59E0B"
    emoji: str = ""
    mood: str = "friendly"
    image_prompt: str = ""


class GeneratedOffer(BaseModel):
    offer_id: str = ""
    merchant_id: str
    merchant_name: str = ""
    headline: str
    body: str
    discount_pct: float
    discount_text: str = ""
    valid_minutes: int = 30
    product_category: str = ""
    visuals: OfferVisuals = OfferVisuals()
    status: OfferStatus = OfferStatus.GENERATED
    created_at: str = ""
    expires_at: str = ""


class OfferRequest(BaseModel):
    lat: float
    lng: float
    user_id: str = "anonymous"
