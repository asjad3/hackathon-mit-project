import random
from app.models.context import MerchantDemand, DemandLevel


def _classify_demand(vs_avg_pct: float) -> DemandLevel:
    if vs_avg_pct <= -40:
        return DemandLevel.VERY_LOW
    elif vs_avg_pct <= -15:
        return DemandLevel.LOW
    elif vs_avg_pct <= 15:
        return DemandLevel.NORMAL
    elif vs_avg_pct <= 40:
        return DemandLevel.HIGH
    return DemandLevel.VERY_HIGH


async def get_merchant_demand(merchant_id: str) -> MerchantDemand:
    """Simulate Payone transaction density for a merchant."""
    avg_volume = random.randint(15, 50)
    current = random.randint(3, avg_volume + 20)
    vs_avg = ((current - avg_volume) / max(avg_volume, 1)) * 100

    return MerchantDemand(
        merchant_id=merchant_id,
        current_volume=current,
        avg_volume=avg_volume,
        level=_classify_demand(vs_avg),
        vs_avg_pct=round(vs_avg, 1),
    )


async def get_zone_demand(merchant_ids: list[str]) -> list[MerchantDemand]:
    """Get simulated demand for all merchants in a zone."""
    return [await get_merchant_demand(mid) for mid in merchant_ids]
