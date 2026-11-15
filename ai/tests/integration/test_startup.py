import asyncio
from pathlib import Path

from src.app import ApplicationServices, create_app, create_runtime_services
from src.config.settings import Settings
from src.dto_contract.classification import RawClassification
from src.harness.gemini_embeddings import EmbeddingProviderError
from src.harness.local_ocr import PaddleOcrClient


class FakeEmbeddingClient:
    def __init__(self) -> None:
        self.calls: list[list[str]] = []

    def embed(self, texts: list[str]) -> list[list[float]]:
        self.calls.append(texts)
        return [[1.0, 0.0] for _ in texts]


class FakeLLMClient:
    def classify(self, prompt: str) -> RawClassification:
        return RawClassification(tags=[], collections=[], new_tags=[], new_collections=[])


def settings(cache_path: Path) -> Settings:
    return Settings(
        gemini_api_key="test-gemini-key",
        groq_api_key="test-groq-key",
        cache_path=cache_path,
        gemini_embedding_dimensions=2,
    )


def test_runtime_services_reuses_a_valid_embedding_cache(tmp_path: Path) -> None:
    cache_path = tmp_path / "catalogue_embeddings.json"
    first_client = FakeEmbeddingClient()
    first = create_runtime_services(settings(cache_path), embedding_client=first_client, llm_client=FakeLLMClient())
    second_client = FakeEmbeddingClient()
    second = create_runtime_services(settings(cache_path), embedding_client=second_client, llm_client=FakeLLMClient())

    assert len(first.index.entries) == len(second.index.entries)
    assert first_client.calls
    assert second_client.calls == []


def test_runtime_services_recovers_from_a_corrupt_embedding_cache(tmp_path: Path) -> None:
    cache_path = tmp_path / "catalogue_embeddings.json"
    cache_path.write_text("not valid json", encoding="utf-8")
    client = FakeEmbeddingClient()

    services = create_runtime_services(settings(cache_path), embedding_client=client, llm_client=FakeLLMClient())

    assert services.index.entries
    assert client.calls
    assert '"model_id"' in cache_path.read_text(encoding="utf-8")


def test_runtime_services_creates_a_lazy_local_ocr_client(tmp_path: Path) -> None:
    services = create_runtime_services(
        settings(tmp_path / "catalogue_embeddings.json"), embedding_client=FakeEmbeddingClient(), llm_client=FakeLLMClient()
    )

    assert isinstance(services.ocr_client, PaddleOcrClient)
    assert services.ocr_client.engine_is_loaded is False


def test_lifespan_places_runtime_services_on_application_state(tmp_path: Path) -> None:
    expected = ApplicationServices(
        index=create_runtime_services(
            settings(tmp_path / "lifespan-cache.json"),
            embedding_client=FakeEmbeddingClient(),
            llm_client=FakeLLMClient(),
        ).index,
        embedding_client=FakeEmbeddingClient(),
        llm_client=FakeLLMClient(),
        max_upload_bytes=1_000,
    )
    app = create_app(service_factory=lambda: expected)

    async def run_lifespan() -> object:
        async with app.router.lifespan_context(app):
            return app.state.services

    assert asyncio.run(run_lifespan()) is expected


def test_lifespan_keeps_the_application_available_when_embedding_startup_fails() -> None:
    app = create_app(service_factory=lambda: (_ for _ in ()).throw(EmbeddingProviderError("provider unavailable")))

    async def run_lifespan() -> object:
        async with app.router.lifespan_context(app):
            return app.state.services

    assert asyncio.run(run_lifespan()) is None
