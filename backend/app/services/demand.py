from app.models.context import MerchantDemand, DemandLevel, TimeBucket


DEMO_DEMAND_PROFILES: dict[str, dict[TimeBucket, tuple[int, int]]] = {
    "cafe-luna": {
        TimeBucket.AFTERNOON: (9, 24),
        TimeBucket.LUNCH: (18, 24),
        TimeBucket.MORNING: (28, 24),
    },
    "pizza-roma": {
        TimeBucket.LUNCH: (35, 26),
        TimeBucket.AFTERNOON: (12, 26),
        TimeBucket.EVENING: (30, 26),
    },
    "bookstore-page1": {
        TimeBucket.AFTERNOON: (8, 16),
        TimeBucket.EVENING: (12, 16),
    },
}


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


async def get_merchant_demand(
    merchant_id: str, time_bucket: TimeBucket | None = None
) -> MerchantDemand:
    """Simulate Payone transaction density for a merchant.

    The values are deterministic so the demo tells the same story every run.
    """
    current, avg_volume = _volume_for(merchant_id, time_bucket)
    vs_avg = ((current - avg_volume) / max(avg_volume, 1)) * 100

    return MerchantDemand(
        merchant_id=merchant_id,
        current_volume=current,
        avg_volume=avg_volume,
        level=_classify_demand(vs_avg),
        vs_avg_pct=round(vs_avg, 1),
    )


async def get_zone_demand(
    merchant_ids: list[str], time_bucket: TimeBucket | None = None
) -> list[MerchantDemand]:
    """Get simulated demand for all merchants in a zone."""
    return [await get_merchant_demand(mid, time_bucket) for mid in merchant_ids]


def _volume_for(
    merchant_id: str, time_bucket: TimeBucket | None = None
) -> tuple[int, int]:
    if time_bucket and merchant_id in DEMO_DEMAND_PROFILES:
        profile = DEMO_DEMAND_PROFILES[merchant_id]
        if time_bucket in profile:
            return profile[time_bucket]

    avg_volume = 20 + (sum(ord(char) for char in merchant_id) % 20)
    current = max(3, avg_volume - 6)
    return current, avg_volume
