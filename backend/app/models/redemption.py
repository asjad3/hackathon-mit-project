from pydantic import BaseModel
from enum import Enum


class TokenStatus(str, Enum):
    ACTIVE = "active"
    REDEEMED = "redeemed"
    EXPIRED = "expired"
    INVALID = "invalid"


class RedemptionToken(BaseModel):
    token_id: str
    offer_id: str
    merchant_id: str
    qr_data: str = ""
    status: TokenStatus = TokenStatus.ACTIVE
    created_at: str = ""
    redeemed_at: str | None = None
    discount_pct: float = 0.0
    discount_eur: float = 0.0


class ValidateTokenRequest(BaseModel):
    token_id: str
    merchant_id: str


class ValidateTokenResponse(BaseModel):
    valid: bool
    message: str = ""
    offer_headline: str = ""
    discount_pct: float = 0.0
    token_status: TokenStatus = TokenStatus.INVALID


class RedemptionRecord(BaseModel):
    record_id: str
    token_id: str
    offer_id: str
    merchant_id: str
    discount_applied_eur: float
    redeemed_at: str
