from fastapi import APIRouter, HTTPException

from app.models.merchant import Merchant, MerchantRules, MerchantDashboard

router = APIRouter(prefix="/api/merchants", tags=["merchants"])

# In-memory store — will be replaced by DB
_merchants: dict[str, Merchant] = {
    "cafe-luna": Merchant(
        merchant_id="cafe-luna",
        name="Café Luna",
        category="cafe",
        address="Sendlinger Str. 12, Munich",
        lat=48.1351,
        lng=11.5761,
        zone_id="zone-altstadt",
        rules=MerchantRules(
            max_discount_pct=20,
            goal="fill_quiet_hours",
            quiet_hours=["14:00-17:00"],
            budget_daily_eur=50,
            product_categories=["coffee", "pastries"],
        ),
    ),
    "pizza-roma": Merchant(
        merchant_id="pizza-roma",
        name="Pizza Roma",
        category="restaurant",
        address="Theatinerstr. 8, Munich",
        lat=48.1395,
        lng=11.5770,
        zone_id="zone-altstadt",
        rules=MerchantRules(
            max_discount_pct=15,
            goal="increase_lunch_traffic",
            quiet_hours=["14:00-16:00"],
            budget_daily_eur=80,
            product_categories=["pizza", "pasta", "drinks"],
        ),
    ),
    "bookstore-page1": Merchant(
        merchant_id="bookstore-page1",
        name="Page One Books",
        category="retail",
        address="Residenzstr. 3, Munich",
        lat=48.1405,
        lng=11.5790,
        zone_id="zone-altstadt",
        rules=MerchantRules(
            max_discount_pct=10,
            goal="rainy_day_traffic",
            quiet_hours=[],
            budget_daily_eur=30,
            product_categories=["books", "stationery"],
        ),
    ),
}


@router.get("", response_model=list[Merchant])
async def list_merchants():
    return list(_merchants.values())


@router.get("/{merchant_id}", response_model=Merchant)
async def get_merchant(merchant_id: str):
    merchant = _merchants.get(merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return merchant


@router.get("/{merchant_id}/rules", response_model=MerchantRules)
async def get_merchant_rules(merchant_id: str):
    merchant = _merchants.get(merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    return merchant.rules


@router.put("/{merchant_id}/rules", response_model=Merchant)
async def update_merchant_rules(merchant_id: str, rules: MerchantRules):
    merchant = _merchants.get(merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    merchant.rules = rules
    return merchant


@router.get("/{merchant_id}/dashboard", response_model=MerchantDashboard)
async def get_merchant_dashboard(merchant_id: str):
    merchant = _merchants.get(merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")
    # TODO: compute from real redemption records
    return MerchantDashboard(
        merchant_id=merchant_id,
        name=merchant.name,
    )
