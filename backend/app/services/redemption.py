import asyncio
import uuid
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.offer import OfferStatus
from app.models.redemption import (
    RedemptionToken,
    TokenStatus,
    ValidateTokenResponse,
    RedemptionRecord,
)
from app.repositories import offer_repository, redemption_repository

INVALID_TOKEN_MESSAGE = "Token is invalid or cannot be redeemed"
_validation_lock = asyncio.Lock()


async def create_token(
    db: Session,
    offer_id: str,
    merchant_id: str,
    discount_pct: float,
    discount_eur: float = 0.0,
    expires_at: str = "",
) -> RedemptionToken:
    """Create a one-time redemption token for an accepted offer."""
    settings = get_settings()
    tz = ZoneInfo(settings.default_timezone)

    token_id = f"tok-{uuid.uuid4().hex[:24]}"
    token = RedemptionToken(
        token_id=token_id,
        offer_id=offer_id,
        merchant_id=merchant_id,
        qr_data=f"citywallet://redeem?token={token_id}&merchant={merchant_id}",
        status=TokenStatus.ACTIVE,
        created_at=datetime.now(tz).isoformat(),
        expires_at=expires_at,
        discount_pct=discount_pct,
        discount_eur=discount_eur,
    )
    return redemption_repository.save_token(db, token)


async def validate_token(db: Session, token_id: str, merchant_id: str) -> ValidateTokenResponse:
    """Validate and redeem a token (one-time use)."""
    async with _validation_lock:
        token = redemption_repository.get_token(db, token_id)

        if not token:
            return _invalid_token_response()

        if token.merchant_id != merchant_id:
            return _invalid_token_response()

        if token.status != TokenStatus.ACTIVE:
            return _invalid_token_response(token.status)

        if _is_expired(token):
            token.status = TokenStatus.EXPIRED
            redemption_repository.save_token(db, token)
            return _invalid_token_response(TokenStatus.EXPIRED)

        settings = get_settings()
        tz = ZoneInfo(settings.default_timezone)

        token.status = TokenStatus.REDEEMED
        token.redeemed_at = datetime.now(tz).isoformat()
        redemption_repository.save_token(db, token)

        record = RedemptionRecord(
            record_id=f"rec-{uuid.uuid4().hex[:8]}",
            token_id=token_id,
            offer_id=token.offer_id,
            merchant_id=merchant_id,
            discount_applied_eur=token.discount_eur,
            redeemed_at=token.redeemed_at,
        )
        redemption_repository.add_record(db, record)

        offer = offer_repository.get_offer(db, token.offer_id)
        if offer:
            offer_repository.set_offer_status(db, token.offer_id, OfferStatus.REDEEMED)

        return ValidateTokenResponse(
            valid=True,
            message="Token redeemed successfully",
            offer_headline=offer.headline if offer else "",
            discount_pct=token.discount_pct,
            token_status=TokenStatus.REDEEMED,
        )


async def get_merchant_redemptions(db: Session, merchant_id: str) -> list[RedemptionRecord]:
    """Get all redemption records for a merchant."""
    return redemption_repository.list_records_for_merchant(db, merchant_id)


def _invalid_token_response(
    token_status: TokenStatus = TokenStatus.INVALID,
) -> ValidateTokenResponse:
    return ValidateTokenResponse(
        valid=False,
        message=INVALID_TOKEN_MESSAGE,
        token_status=token_status,
    )


def _is_expired(token: RedemptionToken) -> bool:
    if not token.expires_at:
        return False

    try:
        expires_at = datetime.fromisoformat(token.expires_at)
    except ValueError:
        return False

    settings = get_settings()
    now = datetime.now(ZoneInfo(settings.default_timezone))
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=ZoneInfo(settings.default_timezone))
    return now >= expires_at
