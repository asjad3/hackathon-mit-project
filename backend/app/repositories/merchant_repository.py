import json
import logging
from pathlib import Path

from app.models.merchant import Merchant, MerchantRules

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
MERCHANTS_FILE = DATA_DIR / "merchants.json"


def _load_seed_merchants() -> dict[str, Merchant]:
    try:
        raw_merchants = json.loads(MERCHANTS_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        logger.exception("Failed to load merchant seed data")
        return {}

    merchants: dict[str, Merchant] = {}
    for raw_merchant in raw_merchants:
        merchant = Merchant(**raw_merchant)
        merchants[merchant.merchant_id] = merchant
    return merchants


_merchants: dict[str, Merchant] = _load_seed_merchants()


def list_merchants() -> list[Merchant]:
    return list(_merchants.values())


def get_merchant(merchant_id: str) -> Merchant | None:
    return _merchants.get(merchant_id)


def update_merchant_rules(merchant_id: str, rules: MerchantRules) -> Merchant | None:
    merchant = _merchants.get(merchant_id)
    if not merchant:
        return None

    merchant.rules = rules
    return merchant


def reset_merchants() -> None:
    _merchants.clear()
    _merchants.update(_load_seed_merchants())
