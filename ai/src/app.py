from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager
from dataclasses import dataclass
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from src.config.settings import Settings, get_settings
from src.harness.gemini_embeddings import EmbeddingClient, EmbeddingProviderError, GeminiEmbeddingClient
from src.harness.llm import GroqLLMClient, LLMClient
from src.harness.local_ocr import OcrClient, PaddleOcrClient
from src.route.analyze import analyze_router
from src.route.health import health_router
from src.service.catalogue import load_catalogue
from src.service.catalogue_cache import CatalogueIndex, EmbeddingError, load_or_build_index


@dataclass(frozen=True)
class ApplicationServices:
    index: CatalogueIndex
    embedding_client: EmbeddingClient
    llm_client: LLMClient
    max_upload_bytes: int
    ocr_client: OcrClient | None = None
    max_ocr_pages: int = 10
    ocr_render_dpi: int = 200
    max_pdf_pages: int = 100


class ProviderConfigurationError(RuntimeError):
    pass


def create_runtime_services(
    settings: Settings,
    *,
    embedding_client: EmbeddingClient | None = None,
    llm_client: LLMClient | None = None,
) -> ApplicationServices:
    if embedding_client is None:
        if settings.gemini_api_key is None:
            raise ProviderConfigurationError("GEMINI_API_KEY is required")
        embedding_client = GeminiEmbeddingClient(
            settings.gemini_api_key.get_secret_value(), settings.gemini_embedding_model
        )
    if llm_client is None:
        if settings.groq_api_key is None:
            raise ProviderConfigurationError("GROQ_API_KEY is required")
        llm_client = GroqLLMClient(settings.groq_api_key.get_secret_value(), settings.llm_model)

    catalogue = load_catalogue(Path("data/data.json"))
    index = load_or_build_index(
        catalogue,
        embedding_client,
        settings.cache_path,
        settings.gemini_embedding_model,
        settings.gemini_embedding_dimensions,
    )
    return ApplicationServices(
        index=index,
        embedding_client=embedding_client,
        llm_client=llm_client,
        max_upload_bytes=settings.max_upload_bytes,
        ocr_client=PaddleOcrClient(settings.ocr_cpu_threads, settings.max_ocr_pixels_per_page),
        max_ocr_pages=settings.max_ocr_pages,
        ocr_render_dpi=settings.ocr_render_dpi,
        max_pdf_pages=settings.max_pdf_pages,
    )


def create_app(
    services: ApplicationServices | None = None,
    service_factory: Callable[[], ApplicationServices] | None = None,
) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        if not hasattr(app.state, "services"):
            try:
                app.state.services = (service_factory or (lambda: create_runtime_services(get_settings())))()
            except (ProviderConfigurationError, EmbeddingError, EmbeddingProviderError):
                app.state.services = None
        yield

    app = FastAPI(title="Document Classifier", lifespan=lifespan)
    if services is not None:
        app.state.services = services
    app.mount("/static", StaticFiles(directory=Path(__file__).resolve().parents[1] / "static"), name="static")
    app.include_router(health_router)
    app.include_router(analyze_router)
    return app
