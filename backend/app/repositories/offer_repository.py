from datetime import datetime
from sqlalchemy.orm import Session

from app.models.offer import GeneratedOffer, OfferStatus, OfferVisuals
from app.database.models import Offer as OfferModel


def _parse_datetime(dt_str: str | None) -> datetime | None:
    """Parse ISO datetime string to datetime object."""
    if not dt_str:
        return None
    try:
        # Handle ISO format with timezone
        return datetime.fromisoformat(dt_str)
    except ValueError:
        # Try without timezone
        try:
            return datetime.strptime(dt_str, "%Y-%m-%dT%H:%M:%S")
        except ValueError:
            return None


def save_offer(db: Session, offer: GeneratedOffer) -> GeneratedOffer:
    """Save or update an offer in the database."""
    existing = db.query(OfferModel).filter(OfferModel.offer_id == offer.offer_id).first()
    
    # Convert string datetimes to datetime objects
    created_at = _parse_datetime(offer.created_at)
    expires_at = _parse_datetime(offer.expires_at)
    
    if existing:
        # Update existing
        existing.merchant_id = offer.merchant_id
        existing.merchant_name = offer.merchant_name
        existing.headline = offer.headline
        existing.body = offer.body
        existing.discount_pct = offer.discount_pct
        existing.discount_text = offer.discount_text
        existing.valid_minutes = offer.valid_minutes
        existing.product_category = offer.product_category
        existing.visuals = offer.visuals.model_dump() if hasattr(offer.visuals, 'model_dump') else offer.visuals
        existing.status = offer.status.value if isinstance(offer.status, OfferStatus) else offer.status
        existing.created_at = created_at
        existing.expires_at = expires_at
    else:
        # Create new
        existing = OfferModel(
            offer_id=offer.offer_id,
            merchant_id=offer.merchant_id,
            merchant_name=offer.merchant_name,
            headline=offer.headline,
            body=offer.body,
            discount_pct=offer.discount_pct,
            discount_text=offer.discount_text,
            valid_minutes=offer.valid_minutes,
            product_category=offer.product_category,
            visuals=offer.visuals.model_dump() if hasattr(offer.visuals, 'model_dump') else offer.visuals,
            status=offer.status.value if isinstance(offer.status, OfferStatus) else offer.status,
            created_at=created_at,
            expires_at=expires_at,
        )
        db.add(existing)
    
    db.commit()
    db.refresh(existing)
    return _to_domain_model(existing)


def get_offer(db: Session, offer_id: str) -> GeneratedOffer | None:
    """Get an offer by ID."""
    offer = db.query(OfferModel).filter(OfferModel.offer_id == offer_id).first()
    if not offer:
        return None
    return _to_domain_model(offer)


def list_offers(db: Session) -> list[GeneratedOffer]:
    """List all offers."""
    offers = db.query(OfferModel).all()
    return [_to_domain_model(o) for o in offers]


def set_offer_status(db: Session, offer_id: str, status: OfferStatus) -> GeneratedOffer | None:
    """Update offer status."""
    offer = db.query(OfferModel).filter(OfferModel.offer_id == offer_id).first()
    if not offer:
        return None

    offer.status = status.value if isinstance(status, OfferStatus) else status
    db.commit()
    db.refresh(offer)
    return _to_domain_model(offer)


def reset_offers(db: Session) -> None:
    """Reset offers (for testing)."""
    db.query(OfferModel).delete()
    db.commit()


def _to_domain_model(offer_model: OfferModel) -> GeneratedOffer:
    """Convert SQLAlchemy model to domain model."""
    return GeneratedOffer(
        offer_id=offer_model.offer_id,
        merchant_id=offer_model.merchant_id,
        merchant_name=offer_model.merchant_name,
        headline=offer_model.headline,
        body=offer_model.body,
        discount_pct=offer_model.discount_pct,
        discount_text=offer_model.discount_text,
        valid_minutes=offer_model.valid_minutes,
        product_category=offer_model.product_category,
        visuals=OfferVisuals(**offer_model.visuals) if offer_model.visuals else OfferVisuals(),
        status=OfferStatus(offer_model.status),
        created_at=offer_model.created_at.isoformat() if offer_model.created_at else "",
        expires_at=offer_model.expires_at.isoformat() if offer_model.expires_at else "",
    )
