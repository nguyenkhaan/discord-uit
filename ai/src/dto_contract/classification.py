from pydantic import BaseModel, ConfigDict, Field


class ExistingSuggestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1)
    confidence: float = Field(ge=0, le=1)
    reason: str = Field(min_length=1)


class NewSuggestion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1)
    slug: str = Field(min_length=1)
    confidence: float = Field(ge=0, le=1)
    reason: str = Field(min_length=1)


class RawClassification(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tags: list[ExistingSuggestion]
    collections: list[ExistingSuggestion]
    new_tags: list[NewSuggestion]
    new_collections: list[NewSuggestion]
