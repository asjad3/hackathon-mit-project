from datetime import datetime
from sqlalchemy.orm import Session

from app.models.redemption import RedemptionRecord, RedemptionToken, TokenStatus
from app.database.models import Token as TokenModel, RedemptionRecord as RedemptionRecordModel


def _parse_datetime(dt_str: str | None) -> datetime | None:
    """Parse ISO datetime string to datetime object."""
    if not dt_str:
        return None
    try:
        return datetime.fromisoformat(dt_str)
    except ValueError:
        return None


def save_token(db: Session, token: RedemptionToken) -> RedemptionToken:
    """Save or update a redemption token."""
    existing = db.query(TokenModel).filter(TokenModel.token_id == token.token_id).first()
    
    # Convert string datetimes to datetime objects
    created_at = _parse_datetime(token.created_at)
    expires_at = _parse_datetime(token.expires_at)
    redeemed_at = _parse_datetime(token.redeemed_at)
    
    if existing:
        # Update existing
        existing.offer_id = token.offer_id
        existing.merchant_id = token.merchant_id
        existing.qr_data = token.qr_data
        existing.status = token.status.value if isinstance(token.status, TokenStatus) else token.status
        existing.created_at = created_at
        existing.expires_at = expires_at
        existing.redeemed_at = redeemed_at
        existing.discount_pct = token.discount_pct
        existing.discount_eur = token.discount_eur
    else:
        # Create new
        existing = TokenModel(
            token_id=token.token_id,
            offer_id=token.offer_id,
            merchant_id=token.merchant_id,
            qr_data=token.qr_data,
            status=token.status.value if isinstance(token.status, TokenStatus) else token.status,
            created_at=created_at,
            expires_at=expires_at,
            redeemed_at=redeemed_at,
            discount_pct=token.discount_pct,
            discount_eur=token.discount_eur,
        )
        db.add(existing)
    
    db.commit()
    db.refresh(existing)
    return _to_token_domain_model(existing)


def get_token(db: Session, token_id: str) -> RedemptionToken | None:
    """Get a token by ID."""
    token = db.query(TokenModel).filter(TokenModel.token_id == token_id).first()
    if not token:
        return None
    return _to_token_domain_model(token)


def add_record(db: Session, record: RedemptionRecord) -> RedemptionRecord:
    """Add a redemption record."""
    redeemed_at = _parse_datetime(record.redeemed_at)
    
    db_record = RedemptionRecordModel(
        record_id=record.record_id,
        token_id=record.token_id,
        offer_id=record.offer_id,
        merchant_id=record.merchant_id,
        discount_applied_eur=record.discount_applied_eur,
        redeemed_at=redeemed_at,
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return record


def list_records(db: Session) -> list[RedemptionRecord]:
    """List all redemption records."""
    records = db.query(RedemptionRecordModel).all()
    return [_to_record_domain_model(r) for r in records]


def list_records_for_merchant(db: Session, merchant_id: str) -> list[RedemptionRecord]:
    """List redemption records for a specific merchant."""
    records = db.query(RedemptionRecordModel).filter(RedemptionRecordModel.merchant_id == merchant_id).all()
    return [_to_record_domain_model(r) for r in records]


def reset_redemptions(db: Session) -> None:
    """Reset redemption data (for testing)."""
    db.query(RedemptionRecordModel).delete()
    db.query(TokenModel).delete()
    db.commit()


def _to_token_domain_model(token_model: TokenModel) -> RedemptionToken:
    """Convert SQLAlchemy model to domain model."""
    return RedemptionToken(
        token_id=token_model.token_id,
        offer_id=token_model.offer_id,
        merchant_id=token_model.merchant_id,
        qr_data=token_model.qr_data,
        status=TokenStatus(token_model.status),
        created_at=token_model.created_at.isoformat() if token_model.created_at else "",
        expires_at=token_model.expires_at.isoformat() if token_model.expires_at else "",
        redeemed_at=token_model.redeemed_at.isoformat() if token_model.redeemed_at else None,
        discount_pct=token_model.discount_pct,
        discount_eur=token_model.discount_eur,
    )


def _to_record_domain_model(record_model: RedemptionRecordModel) -> RedemptionRecord:
    """Convert SQLAlchemy model to domain model."""
    return RedemptionRecord(
        record_id=record_model.record_id,
        token_id=record_model.token_id,
        offer_id=record_model.offer_id,
        merchant_id=record_model.merchant_id,
        discount_applied_eur=record_model.discount_applied_eur,
        redeemed_at=record_model.redeemed_at.isoformat(),
    )
