import logging
from sqlalchemy.orm import Session

from app.models.merchant import Merchant, MerchantRules
from app.database.models import Merchant as MerchantModel

logger = logging.getLogger(__name__)


def list_merchants(db: Session) -> list[Merchant]:
    """List all merchants from database."""
    merchants = db.query(MerchantModel).all()
    return [
        Merchant(
            merchant_id=m.merchant_id,
            name=m.name,
            category=m.category,
            address=m.address,
            lat=m.lat,
            lng=m.lng,
            zone_id=m.zone_id,
            active=m.active,
            rules=MerchantRules(
                max_discount_pct=m.max_discount_pct,
                goal=m.goal,
                quiet_hours=m.quiet_hours,
                budget_daily_eur=m.budget_daily_eur,
                product_categories=m.product_categories,
                min_order_eur=m.min_order_eur,
            ),
        )
        for m in merchants
    ]


def get_merchant(db: Session, merchant_id: str) -> Merchant | None:
    """Get a merchant by ID."""
    merchant = db.query(MerchantModel).filter(MerchantModel.merchant_id == merchant_id).first()
    if not merchant:
        return None
    
    return Merchant(
        merchant_id=merchant.merchant_id,
        name=merchant.name,
        category=merchant.category,
        address=merchant.address,
        lat=merchant.lat,
        lng=merchant.lng,
        zone_id=merchant.zone_id,
        active=merchant.active,
        rules=MerchantRules(
            max_discount_pct=merchant.max_discount_pct,
            goal=merchant.goal,
            quiet_hours=merchant.quiet_hours,
            budget_daily_eur=merchant.budget_daily_eur,
            product_categories=merchant.product_categories,
            min_order_eur=merchant.min_order_eur,
        ),
    )


def update_merchant_rules(db: Session, merchant_id: str, rules: MerchantRules) -> Merchant | None:
    """Update merchant rules."""
    merchant = db.query(MerchantModel).filter(MerchantModel.merchant_id == merchant_id).first()
    if not merchant:
        return None

    merchant.max_discount_pct = rules.max_discount_pct
    merchant.goal = rules.goal
    merchant.quiet_hours = rules.quiet_hours
    merchant.budget_daily_eur = rules.budget_daily_eur
    merchant.product_categories = rules.product_categories
    merchant.min_order_eur = rules.min_order_eur
    
    db.commit()
    db.refresh(merchant)
    
    return get_merchant(db, merchant_id)


def reset_merchants(db: Session) -> None:
    """Reset merchants (for testing)."""
    db.query(MerchantModel).delete()
    db.commit()
