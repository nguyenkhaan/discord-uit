import asyncio
import unittest
from io import BytesIO
from unittest.mock import AsyncMock, patch
from zipfile import ZIP_DEFLATED, ZipFile

import pymupdf

from src.config.setting import Settings
from src.content.file_probe import ContentProcessingError, probe_file
from src.content.pdf_ocr import OcrProvider
from src.content.text_extractors import extract_document


def create_pdf(text: str | None, page_count: int = 1) -> bytes:
    document = pymupdf.open()
    for _ in range(page_count):
        page = document.new_page()
        if text is None:
            page.draw_rect(pymupdf.Rect(20, 20, 250, 250), fill=(0.9, 0.9, 0.9))
        else:
            page.insert_text((72, 72), text)
    payload = document.tobytes()
    document.close()
    return payload


def create_ooxml(entries: dict[str, str]) -> bytes:
    output = BytesIO()
    with ZipFile(output, "w", ZIP_DEFLATED) as archive:
        for name, xml in entries.items():
            archive.writestr(name, xml)
    return output.getvalue()


class FixedOcrProvider(OcrProvider):
    def __init__(self, text: str = "Recognized scanned document text.") -> None:
        self.text = text
        self.calls = 0

    async def extract_text(self, image_bytes: bytes) -> str:
        self.calls += 1
        return self.text


class TextExtractorTests(unittest.IsolatedAsyncioTestCase):
    async def test_text_pdf_skips_ocr(self) -> None:
        data = create_pdf("A readable document with searchable text content.")
        probe = probe_file(data, "text.pdf", "application/pdf", 1_000_000)
        ocr = FixedOcrProvider()

        result = await extract_document(data, probe, Settings(), ocr)

        self.assertIn("searchable text", result.text)
        self.assertFalse(result.needs_ocr)
        self.assertEqual(ocr.calls, 0)

    async def test_scan_like_pdf_uses_ocr(self) -> None:
        data = create_pdf(None)
        probe = probe_file(data, "scan.pdf", "application/pdf", 1_000_000)
        ocr = FixedOcrProvider()

        result = await extract_document(data, probe, Settings(), ocr)

        self.assertEqual(result.text, "Recognized scanned document text.")
        self.assertTrue(result.needs_ocr)
        self.assertEqual(ocr.calls, 1)

    async def test_rejects_pdf_and_ocr_page_limits_before_partial_extraction(self) -> None:
        data = create_pdf(None, page_count=2)
        probe = probe_file(data, "scan.pdf", "application/pdf", 1_000_000)
        ocr = FixedOcrProvider()

        with self.assertRaises(ContentProcessingError) as pdf_limit:
            await extract_document(data, probe, Settings(_env_file=None, max_pdf_pages=1), ocr)
        with self.assertRaises(ContentProcessingError) as ocr_limit:
            await extract_document(data, probe, Settings(_env_file=None, max_ocr_pages=1), ocr)

        self.assertEqual(pdf_limit.exception.code, "PDF_PAGE_LIMIT_EXCEEDED")
        self.assertEqual(ocr_limit.exception.code, "OCR_PAGE_LIMIT_EXCEEDED")
        self.assertEqual(ocr.calls, 0)

    async def test_extracts_txt_docx_and_pptx_as_plain_text(self) -> None:
        settings = Settings(_env_file=None)
        txt_data = b"Plain text material."
        docx_data = create_ooxml({
            "[Content_Types].xml": "<Types/>",
            "word/document.xml": '<w:document xmlns:w="w"><w:p><w:r><w:t>Word text</w:t></w:r></w:p></w:document>',
        })
        pptx_data = create_ooxml({
            "[Content_Types].xml": "<Types/>",
            "ppt/presentation.xml": '<p:presentation xmlns:p="p"/>',
            "ppt/slides/slide1.xml": '<p:sld xmlns:p="p" xmlns:a="a"><a:t>Slide text</a:t></p:sld>',
        })

        txt = await extract_document(txt_data, probe_file(txt_data, "notes.txt", "text/plain", 1000), settings)
        docx = await extract_document(docx_data, probe_file(docx_data, "notes.docx", "application/octet-stream", 1000), settings)
        pptx = await extract_document(pptx_data, probe_file(pptx_data, "slides.pptx", "application/octet-stream", 1000), settings)

        self.assertEqual(txt.text, "Plain text material.")
        self.assertIn("Word text", docx.text)
        self.assertIn("Slide text", pptx.text)

    async def test_enforces_page_count_and_ocr_timeout(self) -> None:
        data = create_pdf(None)
        settings = Settings(_env_file=None, max_pdf_pages=1, ocr_timeout_seconds=1)
        probe = probe_file(data, "scan.pdf", "application/pdf", 1_000_000)

        class SlowOcr(FixedOcrProvider):
            async def extract_text(self, image_bytes: bytes) -> str:
                await asyncio.sleep(2)
                return await super().extract_text(image_bytes)

        with self.assertRaises(ContentProcessingError) as raised:
            await extract_document(data, probe, settings, SlowOcr())

        self.assertEqual(raised.exception.code, "OCR_TIMEOUT")

    async def test_ocr_timeout_kills_and_reaps_pdf_render_process(self) -> None:
        data = create_pdf(None)
        settings = Settings(_env_file=None, max_pdf_pages=1, ocr_timeout_seconds=1)
        probe = probe_file(data, "scan.pdf", "application/pdf", 1_000_000)

        class HungRenderProcess:
            def __init__(self) -> None:
                self.killed = False
                self.returncode = None

            async def communicate(self, input: bytes) -> tuple[bytes, bytes]:
                await asyncio.Event().wait()
                return b"", b""

            def kill(self) -> None:
                self.killed = True

            async def wait(self) -> int:
                return -9

        process = HungRenderProcess()
        with patch(
            "src.content.pdf_ocr.asyncio.create_subprocess_exec",
            new=AsyncMock(return_value=process),
        ) as start_process:
            with self.assertRaises(ContentProcessingError) as raised:
                await extract_document(data, probe, settings, FixedOcrProvider())

        self.assertEqual(raised.exception.code, "OCR_TIMEOUT")
        start_process.assert_awaited_once()
        self.assertTrue(process.killed)

    async def test_rejects_ocr_text_over_the_configured_total_limit(self) -> None:
        data = create_pdf(None, page_count=3)
        settings = Settings(_env_file=None, max_extracted_text_chars=1_000, max_ocr_pages=3)
        probe = probe_file(data, "scan.pdf", "application/pdf", 1_000_000)
        ocr = FixedOcrProvider("x" * 600)

        with self.assertRaises(ContentProcessingError) as raised:
            await extract_document(data, probe, settings, ocr)

        self.assertEqual(raised.exception.code, "TEXT_TOO_LONG")
        self.assertEqual(ocr.calls, 2)

