from pydantic import BaseModel, ConfigDict, Field, model_validator


class CatalogueEntry(BaseModel):
    model_config = ConfigDict(frozen=True, str_strip_whitespace=True)

    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    slug: str = Field(min_length=1)
    description: str = Field(min_length=1)


class Tag(CatalogueEntry):
    pass


class Collection(CatalogueEntry):
    keywords: list[str] = Field(default_factory=list)


class Catalogue(BaseModel):
    tags: list[Tag] = Field(default_factory=list)
    collections: list[Collection] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_unique_fields(self) -> "Catalogue":
        self._validate_unique(self.tags, "tag")
        self._validate_unique(self.collections, "collection")
        return self

    @staticmethod
    def _validate_unique(entries: list[CatalogueEntry], entry_type: str) -> None:
        for field_name in ("id", "slug"):
            values = [getattr(entry, field_name) for entry in entries]
            if len(values) != len(set(values)):
                raise ValueError(f"duplicate {entry_type} {field_name}")
