from functools import lru_cache
from pathlib import Path

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = Field(default=5050, ge=1, le=65535)
    gemini_api_key: SecretStr | None = None
    gemini_embedding_model: str = "gemini-embedding-2"
    gemini_embedding_dimensions: int = Field(default=3072, gt=0)
    cache_path: Path = Path("cache/catalogue_embeddings.json")
    groq_api_key: SecretStr | None = None
    llm_model: str = "openai/gpt-oss-20b"
    max_upload_bytes: int = Field(default=10 * 1024 * 1024, gt=0)
    max_ocr_pages: int = Field(default=10, gt=0, le=100)
    ocr_render_dpi: int = Field(default=200, ge=72, le=400)
    ocr_cpu_threads: int = Field(default=2, gt=0, le=16)
    max_ocr_pixels_per_page: int = Field(default=20_000_000, gt=0)
    max_pdf_pages: int = Field(default=100, gt=0, le=1_000)


@lru_cache
def get_settings() -> Settings:
    return Settings()
