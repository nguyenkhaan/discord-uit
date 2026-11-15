from pathlib import Path

from fastapi import APIRouter, File, Request, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from starlette.concurrency import run_in_threadpool

from src.harness.gemini_embeddings import EmbeddingProviderError
from src.harness.llm import LLMProviderError
from src.service.classification import ClassificationError, ClassificationResult, classify
from src.service.extraction import (
    DocumentTooLarge,
    ExtractionError,
    NoExtractableText,
    TooManyPdfPages,
    UnsupportedDocument,
    extract_text,
)
from src.service.retrieval import retrieve_candidates

TEMPLATES = Jinja2Templates(directory=str(Path(__file__).resolve().parents[2] / "templates"))
analyze_router = APIRouter()


@analyze_router.get("/", response_class=HTMLResponse)
def home(request: Request) -> HTMLResponse:
    return render_page(request)


@analyze_router.post("/analyze", response_class=HTMLResponse)
async def analyze_document(request: Request, document: UploadFile | None = File(default=None)) -> HTMLResponse:
    if document is None or not document.filename:
        return render_page(request, error="Choose a document before analysing.", status_code=400)

    services = getattr(request.app.state, "services", None)
    if services is None:
        return render_page(
            request,
            error="Classification is not configured yet. Add the provider keys to .env and restart the app.",
            status_code=503,
        )

    try:
        content = await read_upload_bytes(document, services.max_upload_bytes)
        extracted = await run_in_threadpool(
            extract_text,
            document.filename,
            content,
            services.max_upload_bytes,
            ocr_client=services.ocr_client,
            max_ocr_pages=services.max_ocr_pages,
            ocr_render_dpi=services.ocr_render_dpi,
            max_pdf_pages=services.max_pdf_pages,
        )
        retrieval = retrieve_candidates(extracted, services.index, services.embedding_client)
        result = classify(retrieval, extracted.text[:12_000], services.llm_client)
    except UnsupportedDocument:
        return render_page(request, error="Only .txt, .md, .pdf, and .docx files are supported.", status_code=400)
    except DocumentTooLarge:
        return render_page(request, error="This file is larger than the configured upload limit.", status_code=400)
    except TooManyPdfPages:
        return render_page(request, error="This PDF exceeds the configured page limit.", status_code=400)
    except NoExtractableText:
        return render_page(
            request,
            error="We could not extract readable text from this document. The PDF may be blank, protected, or exceed the OCR page limit.",
            status_code=400,
        )
    except ExtractionError:
        return render_page(request, error="We could not read this document. Try another supported file.", status_code=400)
    except (EmbeddingProviderError, LLMProviderError, ClassificationError, ValueError):
        return render_page(
            request,
            error="Classification is temporarily unavailable. Please try again in a moment.",
            status_code=503,
        )

    return render_page(
        request,
        result=result,
        filename=extracted.filename,
        was_truncated=retrieval.was_truncated,
        entries={
            indexed.entry.id: {"name": indexed.entry.name, "slug": indexed.entry.slug}
            for indexed in services.index.entries
        },
    )


async def read_upload_bytes(
    document: UploadFile,
    max_upload_bytes: int,
    chunk_size: int = 64 * 1024,
) -> bytes:
    chunks: list[bytes] = []
    total_bytes = 0
    while chunk := await document.read(chunk_size):
        total_bytes += len(chunk)
        if total_bytes > max_upload_bytes:
            raise DocumentTooLarge(f"Document exceeds the maximum upload size of {max_upload_bytes} bytes")
        chunks.append(chunk)
    return b"".join(chunks)


def render_page(
    request: Request,
    *,
    result: ClassificationResult | None = None,
    error: str | None = None,
    filename: str | None = None,
    was_truncated: bool = False,
    entries: dict[str, dict[str, str]] | None = None,
    status_code: int = 200,
) -> HTMLResponse:
    return TEMPLATES.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "result": result,
            "error": error,
            "filename": filename,
            "was_truncated": was_truncated,
            "entries": entries or {},
        },
        status_code=status_code,
    )
