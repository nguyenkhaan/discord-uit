import asyncio
import logging
import unittest

import httpx

from src.config.setting import Settings
from src.content.file_probe import ContentProcessingError
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
