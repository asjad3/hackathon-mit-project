import uuid
from datetime import datetime
from zoneinfo import ZoneInfo

from app.config import get_settings
from app.models.redemption import (
    RedemptionToken,
    TokenStatus,
    ValidateTokenResponse,
    RedemptionRecord,
)

_tokens: dict[str, RedemptionToken] = {}
_records: list[RedemptionRecord] = []


async def create_token(offer_id: str, merchant_id: str, discount_pct: float) -> RedemptionToken:
    """Create a one-time redemption token for an accepted offer."""
    settings = get_settings()
    tz = ZoneInfo(settings.default_timezone)

    token_id = f"tok-{uuid.uuid4().hex[:12]}"
    token = RedemptionToken(
        token_id=token_id,
        offer_id=offer_id,
        merchant_id=merchant_id,
        qr_data=f"citywallet://{token_id}",
        status=TokenStatus.ACTIVE,
        created_at=datetime.now(tz).isoformat(),
        discount_pct=discount_pct,
    )
    _tokens[token_id] = token
    return token


async def validate_token(token_id: str, merchant_id: str) -> ValidateTokenResponse:
    """Validate and redeem a token (one-time use)."""
    token = _tokens.get(token_id)

    if not token:
        return ValidateTokenResponse(valid=False, message="Token not found")

    if token.merchant_id != merchant_id:
        return ValidateTokenResponse(valid=False, message="Token does not belong to this merchant")

    if token.status == TokenStatus.REDEEMED:
        return ValidateTokenResponse(valid=False, message="Token already redeemed")

    if token.status == TokenStatus.EXPIRED:
        return ValidateTokenResponse(valid=False, message="Token has expired")

    settings = get_settings()
    tz = ZoneInfo(settings.default_timezone)

    token.status = TokenStatus.REDEEMED
    token.redeemed_at = datetime.now(tz).isoformat()

    record = RedemptionRecord(
        record_id=f"rec-{uuid.uuid4().hex[:8]}",
        token_id=token_id,
        offer_id=token.offer_id,
        merchant_id=merchant_id,
        discount_applied_eur=token.discount_eur,
        redeemed_at=token.redeemed_at,
    )
    _records.append(record)

    return ValidateTokenResponse(
        valid=True,
        message="Token redeemed successfully",
        discount_pct=token.discount_pct,
        token_status=TokenStatus.REDEEMED,
    )


async def get_merchant_redemptions(merchant_id: str) -> list[RedemptionRecord]:
    """Get all redemption records for a merchant."""
    return [r for r in _records if r.merchant_id == merchant_id]
