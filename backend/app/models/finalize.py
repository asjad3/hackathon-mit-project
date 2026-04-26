from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CoarseContext(BaseModel):
    model_config = ConfigDict(extra="forbid")

    time_bucket: str = Field(min_length=1, max_length=64)
    weather_bucket: str = Field(min_length=1, max_length=64)
    area_bucket: str = Field(min_length=1, max_length=64)
    demand_bucket: str = Field(min_length=1, max_length=64)
    event_tags: list[str] = Field(default_factory=list, max_length=10)


class LocalModelOutput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    headline: str = Field(min_length=1, max_length=120)
    body: str = Field(min_length=1, max_length=800)
    discount_pct: float = Field(ge=0)
    validity_minutes: int = Field(gt=0)


class GenUiDraft(BaseModel):
    model_config = ConfigDict(extra="forbid")

    badge_text: str | None = Field(default=None, max_length=80)
    image_prompt: str | None = Field(default=None, max_length=300)
    color_palette: dict[str, str | None] | None = None


class FinalizeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    session_id: str = Field(min_length=1, max_length=128)
    client_pseudonym: str | None = Field(default=None, max_length=128)
    merchant_id: str = Field(min_length=1, max_length=128)
    intent_summary: str = Field(min_length=1, max_length=240)
    coarse_context: CoarseContext
    local_model_output: LocalModelOutput
    gen_ui_draft: GenUiDraft | None = None


class FinalizeResponse(BaseModel):
    trace_id: str
    offer_id: str
    headline: str
    body: str
    discount_pct: float
    validity_minutes: int
    valid_until: str
    gen_ui: dict[str, Any] = Field(default_factory=dict)
