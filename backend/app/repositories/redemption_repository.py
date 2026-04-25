from app.models.redemption import RedemptionRecord, RedemptionToken

_tokens: dict[str, RedemptionToken] = {}
_records: list[RedemptionRecord] = []


def save_token(token: RedemptionToken) -> RedemptionToken:
    _tokens[token.token_id] = token
    return token


def get_token(token_id: str) -> RedemptionToken | None:
    return _tokens.get(token_id)


def add_record(record: RedemptionRecord) -> RedemptionRecord:
    _records.append(record)
    return record


def list_records() -> list[RedemptionRecord]:
    return list(_records)


def list_records_for_merchant(merchant_id: str) -> list[RedemptionRecord]:
    return [record for record in _records if record.merchant_id == merchant_id]


def reset_redemptions() -> None:
    _tokens.clear()
    _records.clear()
