from functools import lru_cache

from pydantic import Field, PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Server
    host: str = "127.0.0.1"
    port: int = Field(default=5050, ge=1, le=65535)
    database_url: PostgresDsn | None = None

    @field_validator("database_url", mode="before")
    @classmethod
    def empty_database_url_is_unconfigured(cls, value: object) -> object:
        if isinstance(value, str) and not value.strip():
            return None
        return value

    # Kafka
    kafka_bootstrap_servers: str = "localhost:9092"
    kafka_group_id: str = "document-classification-ai-v1"
    kafka_requested_topic: str = "document.classification.requested.v1"
    kafka_completed_topic: str = "document.classification.completed.v1"
    kafka_failed_topic: str = "document.classification.failed.v1"
    kafka_dlq_topic: str = "document.classification.dlq.v1"

    service_id: str = "ai-classification-worker"
    job_lease_seconds: int = Field(default=300, ge=30, le=3600)
    kafka_request_timeout_ms: int = Field(default=10_000, ge=1_000)
    max_kafka_event_bytes: int = Field(default=1_048_576, ge=1_024)
    worker_processing_attempts: int = Field(default=3, ge=1, le=10)
    worker_retry_backoff_ms: int = Field(default=500, ge=10, le=30_000)

    # OCR
    ocr_timeout_seconds: int = Field(default=120, ge=1, le=3600)
    max_upload_bytes: int = Field(default=10_485_760, ge=1)  # 10MB
    max_ocr_pages: int = Field(default=20, ge=1)
    ocr_render_dpi: int = Field(default=300, ge=72, le=600)
    ocr_cpu_threads: int = Field(default=4, ge=1)
    ocr_languages: str = "eng+vie"
    tesseract_command: str = "tesseract"
    max_ocr_pixels_per_page: int = Field(default=16_777_216, ge=1)  # 16 megapixels
    max_pdf_pages: int = Field(default=100, ge=1)
    max_archive_expanded_bytes: int = Field(default=50_000_000, ge=1_024)
    max_extracted_text_chars: int = Field(default=200_000, ge=1_000)
    pdf_min_alnum_chars_per_page: int = Field(default=40, ge=1)
    pdf_min_alnum_ratio: float = Field(default=0.5, ge=0, le=1)
    document_url_allowed_hosts: str = "localhost:9000,127.0.0.1:9000,minio:9000"
    document_download_timeout_seconds: int = Field(default=30, ge=1, le=300)

    # LLM (Groq / OpenRouter)
    llm_provider: str = "groq"
    llm_timeout_seconds: int = Field(default=60, ge=1, le=3600)
    groq_api_key: str | None = None
    llm_model: str = "openai/gpt-oss-20b"

    # Embedding model
    gemini_api_key: str | None = None
    gemini_embedding_model: str = "gemini-embedding-2"
    cache_path: str = "cache/catalogue_embeddings.json"

@lru_cache
def get_settings() -> Settings:
    return Settings()
