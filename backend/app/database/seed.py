"""Database seeding functions."""
import json
import logging
from pathlib import Path
from sqlalchemy.orm import Session

from app.database.models import Merchant

logger = logging.getLogger(__name__)


def seed_merchants(db: Session) -> int:
    """
    Seed merchants from JSON file if database is empty.
    Returns the number of merchants seeded.
    """
    # Check if merchants already exist
    existing_count = db.query(Merchant).count()
    if existing_count > 0:
        logger.info(f"Merchants already seeded: {existing_count} records")
        return 0

    # Load merchants from JSON
    merchants_file = Path(__file__).parent.parent / "data" / "merchants.json"
    
    if not merchants_file.exists():
        logger.error(f"Merchants data file not found: {merchants_file}")
        return 0

    try:
        with open(merchants_file, "r", encoding="utf-8") as f:
            merchants_data = json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        logger.error(f"Failed to load merchants data: {e}")
        return 0

    # Insert merchants
    seeded_count = 0
    for data in merchants_data:
        merchant = Merchant(
            merchant_id=data["merchant_id"],
            name=data["name"],
            category=data.get("category", ""),
            address=data.get("address", ""),
            lat=data.get("lat", 0.0),
            lng=data.get("lng", 0.0),
            zone_id=data.get("zone_id", ""),
            active=True,
            max_discount_pct=data["rules"]["max_discount_pct"],
            goal=data["rules"]["goal"],
            quiet_hours=data["rules"]["quiet_hours"],
            budget_daily_eur=data["rules"]["budget_daily_eur"],
            product_categories=data["rules"]["product_categories"],
            min_order_eur=data["rules"].get("min_order_eur", 0.0),
        )
        db.add(merchant)
        seeded_count += 1

    db.commit()
    logger.info(f"Seeded {seeded_count} merchants")
    return seeded_count


def clear_database(db: Session):
    """Clear all data from database (for testing)."""
    db.query(Merchant).delete()
    db.query(RedemptionRecord).delete()
    db.query(Token).delete()
    db.query(Offer).delete()
    db.commit()
