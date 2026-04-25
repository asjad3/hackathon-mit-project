from pydantic import BaseModel


class MerchantRules(BaseModel):
    max_discount_pct: float = 20.0
    goal: str = "fill_quiet_hours"
    quiet_hours: list[str] = []
    budget_daily_eur: float = 50.0
    product_categories: list[str] = []
    min_order_eur: float = 0.0


class Merchant(BaseModel):
    merchant_id: str
    name: str
    category: str = ""
    address: str = ""
    lat: float = 0.0
    lng: float = 0.0
    zone_id: str = ""
    rules: MerchantRules = MerchantRules()
    active: bool = True


class MerchantDashboard(BaseModel):
    merchant_id: str
    name: str
    total_offers_generated: int = 0
    total_accepted: int = 0
    total_redeemed: int = 0
    total_discount_eur: float = 0.0
    acceptance_rate: float = 0.0
    redemption_rate: float = 0.0
