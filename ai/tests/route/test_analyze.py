import asyncio
from io import BytesIO
import threading
import time

from httpx import ASGITransport, AsyncClient
from pypdf import PdfWriter
import pytest

from data.contract import Collection, Tag
from src.app import ApplicationServices, create_app
from src.dto_contract.classification import ExistingSuggestion, RawClassification
from src.harness.gemini_embeddings import EmbeddingProviderError
from src.harness.llm import LLMProviderError
from src.harness.local_ocr import OcrError
from src.route.analyze import read_upload_bytes
from src.service.catalogue_cache import CatalogueIndex, IndexedEntry
from src.service.extraction import DocumentTooLarge


class FakeEmbeddingClient:
    def embed(self, texts: list[str]) -> list[list[float]]:
        return [[1.0, 0.0] for _ in texts]


class FakeLLMClient:
    def __init__(self, response: RawClassification | Exception) -> None:
        self.response = response

    def classify(self, prompt: str) -> RawClassification:
        if isinstance(self.response, Exception):
            raise self.response
        return self.response


def services(response: RawClassification | Exception) -> ApplicationServices:
    index = CatalogueIndex(
        entries=[
            IndexedEntry(
                "tag",
                Tag(id="tag-ai", name="Artificial Intelligence", slug="artificial-intelligence", description="AI systems"),
                [1.0, 0.0],
            ),
            IndexedEntry(
                "collection",
                Collection(
                    id="collection-ai",
                    name="AI & Intelligent Systems",
                    slug="ai-intelligent-systems",
                    description="AI learning resources",
                    keywords=["AI"],
                ),
                [1.0, 0.0],
            ),
        ]
    )
    return ApplicationServices(
        index=index,
        embedding_client=FakeEmbeddingClient(),
        llm_client=FakeLLMClient(response),
        max_upload_bytes=1_000_000,
    )


def limited_services(response: RawClassification | Exception, max_upload_bytes: int) -> ApplicationServices:
    configured = services(response)
    return ApplicationServices(
        index=configured.index,
        embedding_client=configured.embedding_client,
        llm_client=configured.llm_client,
        max_upload_bytes=max_upload_bytes,
    )


def blank_pdf() -> bytes:
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    output = BytesIO()
    writer.write(output)
    return output.getvalue()


def successful_response() -> RawClassification:
    return RawClassification(
        tags=[ExistingSuggestion(id="tag-ai", confidence=0.91, reason="The document discusses AI agents.")],
        collections=[
            ExistingSuggestion(id="collection-ai", confidence=0.88, reason="It belongs with AI course material.")
        ],
        new_tags=[],
        new_collections=[],
    )


async def post_document(response: RawClassification | Exception, files: dict[str, tuple[str, bytes, str]] | None):
    app = create_app(services=services(response))
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        return await client.post("/analyze", files=files)


def test_get_home_renders_upload_form() -> None:
    async def request_home() -> str:
        app = create_app(services=services(successful_response()))
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/")
        assert response.status_code == 200
        return response.text

    body = asyncio.run(request_home())

    assert 'action="/analyze"' in body
    assert 'accept=".txt,.md,.pdf,.docx"' in body


def test_analyze_renders_tag_and_collection_results() -> None:
    response = asyncio.run(
        post_document(successful_response(), {"document": ("lesson.txt", b"AI agents coordinate tasks.", "text/plain")})
    )

    assert response.status_code == 200
    assert "Artificial Intelligence" in response.text
    assert "AI &amp; Intelligent Systems" in response.text
    assert "91%" in response.text
    assert "The document discusses AI agents." in response.text


def test_analyze_rejects_missing_file_on_the_same_page() -> None:
    response = asyncio.run(post_document(successful_response(), None))

    assert response.status_code == 400
    assert "Choose a document before analysing." in response.text
    assert "Upload a document" in response.text


def test_analyze_rejects_unsupported_document_type() -> None:
    response = asyncio.run(
        post_document(successful_response(), {"document": ("lesson.csv", b"topic,ai", "text/csv")})
    )

    assert response.status_code == 400
    assert "Only .txt, .md, .pdf, and .docx files are supported." in response.text


def test_read_upload_stops_after_the_first_chunk_past_the_limit() -> None:
    class ChunkedUpload:
        def __init__(self) -> None:
            self.chunks = [b"abc", b"d", b"never-read"]
            self.calls = 0

        async def read(self, size: int) -> bytes:
            self.calls += 1
            return self.chunks.pop(0) if self.chunks else b""

    upload = ChunkedUpload()

    with pytest.raises(DocumentTooLarge, match="maximum upload size"):
        asyncio.run(read_upload_bytes(upload, max_upload_bytes=3, chunk_size=3))

    assert upload.calls == 2


def test_analyze_shows_extraction_error_without_server_error() -> None:
    response = asyncio.run(
        post_document(successful_response(), {"document": ("lesson.txt", b"\xff\xfe", "text/plain")})
    )

    assert response.status_code == 400
    assert "could not extract readable text" in response.text
    assert "Traceback" not in response.text


def test_analyze_uses_configured_ocr_for_an_image_only_pdf() -> None:
    class FakeOcrClient:
        def __init__(self) -> None:
            self.calls = 0

        def extract_pdf_text(self, content: bytes, *, max_pages: int, render_dpi: int) -> str:
            self.calls += 1
            assert (max_pages, render_dpi) == (3, 180)
            return "Scanned AI lesson"

    ocr = FakeOcrClient()
    configured = services(successful_response())
    app = create_app(
        services=ApplicationServices(
            index=configured.index,
            embedding_client=configured.embedding_client,
            llm_client=configured.llm_client,
            max_upload_bytes=configured.max_upload_bytes,
            ocr_client=ocr,
            max_ocr_pages=3,
            ocr_render_dpi=180,
        )
    )

    async def submit() -> object:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            return await client.post("/analyze", files={"document": ("scanned.pdf", blank_pdf(), "application/pdf")})

    response = asyncio.run(submit())

    assert response.status_code == 200
    assert ocr.calls == 1
    assert "Artificial Intelligence" in response.text


def test_analyze_shows_safe_error_when_local_ocr_fails() -> None:
    class FailingOcrClient:
        def extract_pdf_text(self, content: bytes, *, max_pages: int, render_dpi: int) -> str:
            raise OcrError("local failure")

    configured = services(successful_response())
    app = create_app(
        services=ApplicationServices(
            index=configured.index,
            embedding_client=configured.embedding_client,
            llm_client=configured.llm_client,
            max_upload_bytes=configured.max_upload_bytes,
            ocr_client=FailingOcrClient(),
        )
    )

    async def submit() -> object:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            return await client.post("/analyze", files={"document": ("scanned.pdf", blank_pdf(), "application/pdf")})

    response = asyncio.run(submit())

    assert response.status_code == 400
    assert "could not extract readable text" in response.text
    assert "OCR is not available" not in response.text
    assert "local failure" not in response.text


def test_health_remains_responsive_while_local_ocr_runs() -> None:
    started = threading.Event()
    release = threading.Event()

    class BlockingOcrClient:
        def extract_pdf_text(self, content: bytes, *, max_pages: int, render_dpi: int) -> str:
            started.set()
            release.wait(timeout=1)
            return "Scanned AI lesson"

    configured = services(successful_response())
    app = create_app(
        services=ApplicationServices(
            index=configured.index,
            embedding_client=configured.embedding_client,
            llm_client=configured.llm_client,
            max_upload_bytes=configured.max_upload_bytes,
            ocr_client=BlockingOcrClient(),
        )
    )

    async def submit_and_check_health() -> tuple[int, float]:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            timer = threading.Timer(0.35, release.set)
            timer.start()
            try:
                start_time = time.monotonic()
                upload = asyncio.create_task(
                    client.post("/analyze", files={"document": ("scanned.pdf", blank_pdf(), "application/pdf")})
                )
                await asyncio.to_thread(started.wait, 1)
                health = await client.get("/health")
                elapsed = time.monotonic() - start_time
                await upload
                return health.status_code, elapsed
            finally:
                release.set()
                timer.cancel()

    status_code, elapsed = asyncio.run(submit_and_check_health())

    assert status_code == 200
    assert elapsed < 0.2


def test_analyze_shows_provider_error_without_server_error() -> None:
    response = asyncio.run(
        post_document(
            LLMProviderError("provider unavailable"),
            {"document": ("lesson.txt", b"AI agents coordinate tasks.", "text/plain")},
        )
    )

    assert response.status_code == 503
    assert "Classification is temporarily unavailable" in response.text
    assert "provider unavailable" not in response.text


def test_analyze_shows_embedding_provider_error_without_server_error() -> None:
    class FailingEmbeddingClient:
        def embed(self, texts: list[str]) -> list[list[float]]:
            raise EmbeddingProviderError("embedding provider unavailable")

    async def submit() -> object:
        configured = services(successful_response())
        app = create_app(
            services=ApplicationServices(
                index=configured.index,
                embedding_client=FailingEmbeddingClient(),
                llm_client=configured.llm_client,
                max_upload_bytes=configured.max_upload_bytes,
            )
        )
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            return await client.post("/analyze", files={"document": ("lesson.txt", b"AI agents", "text/plain")})

    response = asyncio.run(submit())

    assert response.status_code == 503
    assert "Classification is temporarily unavailable" in response.text
    assert "embedding provider unavailable" not in response.text


def test_analyze_renders_mixed_language_content_safely() -> None:
    mixed_response = RawClassification(
        tags=[ExistingSuggestion(id="tag-ai", confidence=0.9, reason="Tài liệu nói về AI agents &amp; retrieval.")],
        collections=[ExistingSuggestion(id="collection-ai", confidence=0.82, reason="Phù hợp với học liệu AI.")],
        new_tags=[],
        new_collections=[],
    )
    response = asyncio.run(
        post_document(mixed_response, {"document": ("bai-hoc.md", "Nội dung về AI".encode(), "text/markdown")})
    )

    assert response.status_code == 200
    assert "Tài liệu nói về AI agents &amp;amp; retrieval." in response.text
    assert "Phù hợp với học liệu AI." in response.text
