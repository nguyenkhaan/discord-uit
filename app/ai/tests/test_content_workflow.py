import asyncio
import logging
import unittest

import httpx
import pymupdf
from unittest.mock import AsyncMock, patch

from src.config.setting import Settings
from src.content.file_probe import ContentProcessingError
from src.content.text_extractors import ExtractedContent
from src.contract.classification_event import ClassificationRequestedEvent
from src.agentic.workflow import extract_request_content


class SlowByteStream(httpx.AsyncByteStream):
    async def __aiter__(self):
        await asyncio.sleep(1.1)
        yield b"hello"

    async def aclose(self) -> None:
        return None


def request_for(url: str, file_size: int) -> ClassificationRequestedEvent:
    return ClassificationRequestedEvent.model_validate(
        {
            "schemaVersion": "v1",
            "eventId": "00000000-0000-0000-0000-000000000001",
            "classificationRunId": "run_1",
            "documentId": "00000000-0000-0000-0000-000000000002",
            "submissionId": "00000000-0000-0000-0000-000000000003",
            "mediaId": "00000000-0000-0000-0000-000000000004",
            "file": {
                "fileName": "notes.txt",
                "mimeType": "text/plain",
                "sizeBytes": file_size,
                "verifiedEtag": "etag-1",
            },
            "signedGetUrl": {
                "value": url,
                "expiresAt": "2099-11-27T12:00:00Z",
            },
            "taxonomy": {"version": "v1", "collectionSlugs": [], "tagSlugs": []},
            "attempt": 1,
            "occurredAt": "2026-11-27T11:00:00Z",
        }
    )


class ContentWorkflowTests(unittest.IsolatedAsyncioTestCase):
    async def test_downloads_only_allowlisted_signed_storage_and_extracts_plain_text(self) -> None:
        payload = b"Private notes content."
        seen_urls: list[str] = []

        async def handler(request: httpx.Request) -> httpx.Response:
            seen_urls.append(str(request.url))
            return httpx.Response(200, content=payload)

        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        try:
            result = await extract_request_content(
                request_for("https://files.internal:9443/private/notes?sig=secret", len(payload)),
                Settings(_env_file=None, document_url_allowed_hosts="files.internal:9443"),
                http_client=client,
            )
        finally:
            await client.aclose()

        self.assertEqual(result.text, "Private notes content.")
        self.assertEqual(len(seen_urls), 1)

    async def test_uses_rapidocr_as_the_default_scanned_pdf_provider(self) -> None:
        document = pymupdf.open()
        page = document.new_page()
        page.draw_rect(pymupdf.Rect(20, 20, 250, 250), fill=(0.9, 0.9, 0.9))
        image_pdf = document.tobytes()
        document.close()
        expected = ExtractedContent("recognized", "ocr", True, 1)

        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, content=image_pdf)

        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        provider = object()
        request = request_for(
            "https://files.internal:9443/private/scan.pdf",
            len(image_pdf),
        )
        request = request.model_copy(
            update={
                "file": request.file.model_copy(
                    update={"file_name": "scan.pdf", "mime_type": "application/pdf"}
                )
            }
        )
        with (
            patch("src.agentic.workflow.RapidOcrProvider", return_value=provider) as provider_factory,
            patch(
                "src.agentic.workflow.extract_document",
                new=AsyncMock(return_value=expected),
            ) as extract_document,
        ):
            try:
                result = await extract_request_content(
                    request,
                    Settings(_env_file=None, document_url_allowed_hosts="files.internal:9443"),
                    http_client=client,
                )
            finally:
                await client.aclose()

        self.assertIs(result, expected)
        provider_factory.assert_called_once_with(2)
        self.assertIs(extract_document.await_args.args[3], provider)

    async def test_http_info_logs_never_include_the_signed_url(self) -> None:
        payload = b"Private notes content."

        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, content=payload)

        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        try:
            with self.assertLogs("httpx", level=logging.INFO) as captured:
                await extract_request_content(
                    request_for("https://files.internal:9443/private/notes?sig=must-stay-private", len(payload)),
                    Settings(_env_file=None, document_url_allowed_hosts="files.internal:9443"),
                    http_client=client,
                )
        finally:
            await client.aclose()

        self.assertTrue(captured.output)
        self.assertNotIn("must-stay-private", "\n".join(captured.output))

    async def test_download_deadline_bounds_total_stream_duration(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(200, stream=SlowByteStream())

        client = httpx.AsyncClient(transport=httpx.MockTransport(handler), timeout=None)
        try:
            with self.assertRaises(ContentProcessingError) as raised:
                await extract_request_content(
                    request_for("https://files.internal:9443/private/notes?sig=secret", 5),
                    Settings(
                        _env_file=None,
                        document_url_allowed_hosts="files.internal:9443",
                        document_download_timeout_seconds=1,
                    ),
                    http_client=client,
                )
        finally:
            await client.aclose()

        self.assertEqual(raised.exception.code, "DOCUMENT_DOWNLOAD_TIMEOUT")

    async def test_rejects_unapproved_storage_host_before_request(self) -> None:
        called = False

        async def handler(request: httpx.Request) -> httpx.Response:
            nonlocal called
            called = True
            return httpx.Response(200, content=b"hello")

        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        try:
            with self.assertRaises(ContentProcessingError) as raised:
                await extract_request_content(
                    request_for("http://127.0.0.1:9000/file.txt", 5),
                    Settings(_env_file=None, document_url_allowed_hosts="storage.internal:9000"),
                    http_client=client,
                )
        finally:
            await client.aclose()

        self.assertEqual(raised.exception.code, "INVALID_STORAGE_URL")
        self.assertFalse(called)

    async def test_rejects_storage_redirects_instead_of_forwarding_signed_url(self) -> None:
        async def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(302, headers={"location": "http://127.0.0.1:22/private"})

        client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        try:
            with self.assertRaises(ContentProcessingError) as raised:
                await extract_request_content(
                    request_for("https://files.internal:9443/private/file.txt?sig=secret", 5),
                    Settings(_env_file=None, document_url_allowed_hosts="files.internal:9443"),
                    http_client=client,
                )
        finally:
            await client.aclose()

        self.assertEqual(raised.exception.code, "DOCUMENT_REDIRECT_DISALLOWED")
