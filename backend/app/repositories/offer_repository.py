from app.models.offer import GeneratedOffer, OfferStatus

_offers: dict[str, GeneratedOffer] = {}


def save_offer(offer: GeneratedOffer) -> GeneratedOffer:
    _offers[offer.offer_id] = offer
    return offer


def get_offer(offer_id: str) -> GeneratedOffer | None:
    return _offers.get(offer_id)


def list_offers() -> list[GeneratedOffer]:
    return list(_offers.values())


def set_offer_status(offer_id: str, status: OfferStatus) -> GeneratedOffer | None:
    offer = _offers.get(offer_id)
    if not offer:
        return None

    offer.status = status
    return offer


def reset_offers() -> None:
    _offers.clear()
