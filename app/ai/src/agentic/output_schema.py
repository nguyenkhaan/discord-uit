from pydantic import BaseModel, ConfigDict, Field, field_validator

from src.contract.classification_event import Suggestion


class ClassificationRecommendations(BaseModel):
    """Strict structured response returned by the recommendation model."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    collection_suggestions: list[Suggestion] = Field(max_length=20)
    tag_suggestions: list[Suggestion] = Field(max_length=30)

    @field_validator("collection_suggestions", "tag_suggestions")
    @classmethod
    def reject_duplicate_slugs(cls, suggestions: list[Suggestion]) -> list[Suggestion]:
        slugs = [suggestion.slug for suggestion in suggestions]
        if len(slugs) != len(set(slugs)):
            raise ValueError("A taxonomy slug may only be suggested once.")
        return suggestions

    def validate_taxonomy(
        self,
        *,
        collection_slugs: set[str],
        tag_slugs: set[str],
    ) -> None:
        if any(item.slug not in collection_slugs for item in self.collection_suggestions):
            raise ValueError("The model suggested a collection outside the supplied taxonomy.")
        if any(item.slug not in tag_slugs for item in self.tag_suggestions):
            raise ValueError("The model suggested a tag outside the supplied taxonomy.")
