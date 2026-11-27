from datetime import datetime, timezone
from typing import Annotated, Literal
from uuid import UUID, uuid4

from pydantic import (
    AnyUrl,
    BaseModel,
    ConfigDict,
    Field,
    StringConstraints,
    field_validator,
)
from pydantic.alias_generators import to_camel

Slug = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=120,
        pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$",
    ),
]
RunId = Annotated[
    str,
    StringConstraints(
        strip_whitespace=True,
        min_length=1,
        max_length=128,
        pattern=r"^[A-Za-z0-9_-]+$",
    ),
]
FiniteConfidence = Annotated[
    float,
    Field(ge=0, le=1, allow_inf_nan=False),
]


class EventModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        extra="forbid",
        str_strip_whitespace=True,
    )

    @field_validator("occurred_at", "expires_at", check_fields=False)
    @classmethod
    def require_timezone(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("Datetime must include a timezone.")
        return value.astimezone(timezone.utc)


class FileMetadata(EventModel):
    file_name: str = Field(min_length=1, max_length=512)
    mime_type: str = Field(min_length=1, max_length=255)
    size_bytes: int = Field(gt=0)
    verified_etag: str = Field(min_length=1, max_length=512)


class SignedGetUrl(EventModel):
    # Do not log or expose this field.
    value: AnyUrl
    expires_at: datetime


class TaxonomySnapshot(EventModel):
    version: str = Field(min_length=1, max_length=128)
    collection_slugs: list[Slug] = Field(max_length=500)
    tag_slugs: list[Slug] = Field(max_length=500)


class ClassificationRequestedEvent(EventModel):
    schema_version: Literal["v1"]
    event_id: UUID
    classification_run_id: RunId
    document_id: UUID
    submission_id: UUID
    media_id: UUID
    file: FileMetadata
    signed_get_url: SignedGetUrl
    taxonomy: TaxonomySnapshot
    attempt: int = Field(ge=1, le=20)
    occurred_at: datetime


class Suggestion(EventModel):
    slug: Slug
    confidence: FiniteConfidence


class ClassificationCompletedEvent(EventModel):
    schema_version: Literal["v1"] = "v1"
    event_id: UUID = Field(default_factory=uuid4)
    classification_run_id: RunId
    document_id: UUID
    submission_id: UUID
    media_id: UUID
    model_id: str = Field(min_length=1, max_length=255)
    ocr_text: str = Field(max_length=200_000)
    ocr_needed: bool
    collection_suggestions: list[Suggestion] = Field(max_length=20)
    tag_suggestions: list[Suggestion] = Field(max_length=30)
    attempt: int = Field(ge=1, le=20)
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ClassificationFailedEvent(EventModel):
    schema_version: Literal["v1"] = "v1"
    event_id: UUID = Field(default_factory=uuid4)
    classification_run_id: RunId
    document_id: UUID
    submission_id: UUID
    media_id: UUID
    failure_code: str = Field(min_length=1, max_length=80)
    # Không đưa signed URL, OCR text, stack trace hoặc nội dung file vào đây.
    failure_message: str = Field(min_length=1, max_length=500)
    retryable: bool
    attempt: int = Field(ge=1, le=20)
    occurred_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))