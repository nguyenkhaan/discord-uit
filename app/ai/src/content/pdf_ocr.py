import asyncio
import contextlib
import math
import sys
from collections.abc import Sequence
from typing import Protocol

import pymupdf

from src.config.setting import Settings
from src.content.file_probe import ContentProcessingError


class OcrProvider(Protocol):
    async def extract_text(self, image_bytes: bytes) -> str: ...


def render_pdf_page(data: bytes, page_number: int, settings: Settings) -> bytes:
    return _render_pdf_page_with_limits(
        data,
        page_number,
        settings.ocr_render_dpi,
        settings.max_ocr_pixels_per_page,
    )


def _render_pdf_page_with_limits(
    data: bytes,
    page_number: int,
    render_dpi: int,
    max_pixels: int,
) -> bytes:
    try:
        with pymupdf.open(stream=data, filetype="pdf") as document:
            page = document.load_page(page_number)
            page_area = max(page.rect.width * page.rect.height, 1)
            allowed_dpi = math.floor(72 * math.sqrt(max_pixels / page_area))
            dpi = min(render_dpi, allowed_dpi)
            if dpi < 72:
                raise ContentProcessingError(
                    "OCR_PAGE_TOO_LARGE",
                    "A PDF page exceeds the OCR image size limit.",
                )
            pixmap = page.get_pixmap(dpi=dpi, colorspace=pymupdf.csRGB, alpha=False)
            if pixmap.width * pixmap.height > max_pixels:
                raise ContentProcessingError(
                    "OCR_PAGE_TOO_LARGE",
                    "A PDF page exceeds the OCR image size limit.",
                )
            return pixmap.tobytes("png")
    except ContentProcessingError:
        raise
    except Exception:
        raise ContentProcessingError("CORRUPT_FILE", "The PDF document could not be read.") from None


async def _render_pdf_page_isolated(
    data: bytes,
    page_number: int,
    settings: Settings,
) -> bytes:
    process = await asyncio.create_subprocess_exec(
        sys.executable,
        "-m",
        "src.content.pdf_render_worker",
        str(page_number),
        str(settings.ocr_render_dpi),
        str(settings.max_ocr_pixels_per_page),
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        image_bytes, error_bytes = await process.communicate(data)
    except BaseException:
        if process.returncode is None:
            with contextlib.suppress(ProcessLookupError):
                process.kill()
        with contextlib.suppress(ProcessLookupError):
            await process.wait()
        raise

    if process.returncode != 0:
        code = error_bytes.decode("ascii", errors="ignore").strip()
        if code == "OCR_PAGE_TOO_LARGE":
            raise ContentProcessingError(
                code,
                "A PDF page exceeds the OCR image size limit.",
            )
        raise ContentProcessingError("CORRUPT_FILE", "The PDF document could not be read.")
    if not image_bytes:
        raise ContentProcessingError("CORRUPT_FILE", "The PDF document could not be read.")
    return image_bytes


async def ocr_pdf_pages(
    data: bytes,
    page_numbers: Sequence[int],
    settings: Settings,
    provider: OcrProvider | None,
    initial_text_chars: int = 0,
) -> dict[int, str]:
    if not page_numbers:
        return {}
    if provider is None:
        raise ContentProcessingError(
            "OCR_PROVIDER_NOT_CONFIGURED",
            "OCR is not configured for scanned documents.",
        )
    if len(page_numbers) > settings.max_ocr_pages:
        raise ContentProcessingError(
            "OCR_PAGE_LIMIT_EXCEEDED",
            "The scanned document exceeds the OCR page limit.",
        )

    recognized: dict[int, str] = {}
    total_chars = initial_text_chars
    try:
        async with asyncio.timeout(settings.ocr_timeout_seconds):
            for page_number in page_numbers:
                image_bytes = await _render_pdf_page_isolated(data, page_number, settings)
                page_text = await provider.extract_text(image_bytes)
                total_chars += len(page_text)
                if total_chars > settings.max_extracted_text_chars:
                    raise ContentProcessingError(
                        "TEXT_TOO_LONG",
                        "Extracted text exceeds the processing limit.",
                    )
                recognized[page_number] = page_text
    except TimeoutError:
        raise ContentProcessingError(
            "OCR_TIMEOUT",
            "OCR did not finish within the processing time limit.",
            retryable=True,
        ) from None
    return recognized
