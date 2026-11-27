import asyncio
import logging
from datetime import datetime, timezone
from urllib.parse import urlsplit

import httpx

from src.agentic.ocr_ai import RapidOcrProvider
from src.config.setting import Settings
from src.content.file_probe import ContentProcessingError, probe_file
from src.content.pdf_ocr import OcrProvider
from src.content.text_extractors import ExtractedContent, extract_document
from src.contract.classification_event import ClassificationRequestedEvent


class _HttpxRequestLogFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        if record.levelno == logging.INFO and record.getMessage().startswith("HTTP Request:"):
            record.msg = "HTTP Request completed"
            record.args = ()
        return True


logging.getLogger("httpx").addFilter(_HttpxRequestLogFilter())


def _validate_storage_url(url: str, settings: Settings) -> None:
    parsed = urlsplit(url)
    allowed_hosts = {
        item.strip().lower()
        for item in settings.document_url_allowed_hosts.split(",")
        if item.strip()
    }
    if (
        parsed.scheme not in {"http", "https"}
        or parsed.hostname is None
        or parsed.netloc.lower() not in allowed_hosts
        or parsed.username is not None
        or parsed.password is not None
        or parsed.fragment
    ):
        raise ContentProcessingError(
            "INVALID_STORAGE_URL",
            "The document storage URL is not allowed.",
        )


async def _download_document(
    event: ClassificationRequestedEvent,
    settings: Settings,
    http_client: httpx.AsyncClient | None = None,
) -> bytes:
    signed_url = str(event.signed_get_url.value)
    _validate_storage_url(signed_url, settings)
    if event.signed_get_url.expires_at <= datetime.now(timezone.utc):
        raise ContentProcessingError(
            "SIGNED_URL_EXPIRED",
            "The document access URL has expired.",
        )

    owns_client = http_client is None
    client = http_client or httpx.AsyncClient(
        follow_redirects=False,
        timeout=settings.document_download_timeout_seconds,
        trust_env=False,
    )
    try:
        async with asyncio.timeout(settings.document_download_timeout_seconds):
            async with client.stream("GET", signed_url) as response:
                if response.is_redirect:
                    raise ContentProcessingError(
                        "DOCUMENT_REDIRECT_DISALLOWED",
                        "The document storage redirected the download request.",
                    ) from None
                if response.status_code in {401, 403, 404}:
                    raise ContentProcessingError(
                        "SIGNED_URL_UNAVAILABLE",
                        "The document access URL is no longer valid.",
                    )
                if response.status_code >= 500:
                    raise ContentProcessingError(
                        "STORAGE_UNAVAILABLE",
                        "Document storage is temporarily unavailable.",
                        retryable=True,
                    )
                if response.status_code >= 400:
                    raise ContentProcessingError(
                        "DOCUMENT_DOWNLOAD_FAILED",
                        "The document could not be downloaded.",
                    )

                content_length = response.headers.get("content-length")
                if content_length:
                    try:
                        declared_size = int(content_length)
                    except ValueError:
                        raise ContentProcessingError(
                            "INVALID_STORAGE_RESPONSE",
                            "Document storage returned invalid file metadata.",
                        ) from None
                    if declared_size > settings.max_upload_bytes:
                        raise ContentProcessingError(
                            "FILE_TOO_LARGE",
                            "The uploaded file exceeds the processing limit.",
                        )

                response_etag = response.headers.get("etag")
                if response_etag and response_etag.strip('"') != event.file.verified_etag.strip('"'):
                    raise ContentProcessingError(
                        "FILE_ETAG_MISMATCH",
                        "The downloaded file does not match its verified metadata.",
                    )

                chunks: list[bytes] = []
                size = 0
                async for chunk in response.aiter_bytes():
                    size += len(chunk)
                    if size > settings.max_upload_bytes:
                        raise ContentProcessingError(
                            "FILE_TOO_LARGE",
                            "The uploaded file exceeds the processing limit.",
                        )
                    chunks.append(chunk)
    except ContentProcessingError:
        raise
    except (httpx.TimeoutException, TimeoutError):
        raise ContentProcessingError(
            "DOCUMENT_DOWNLOAD_TIMEOUT",
            "Downloading the document exceeded the time limit.",
            retryable=True,
        ) from None
    except httpx.HTTPError:
        raise ContentProcessingError(
            "DOCUMENT_DOWNLOAD_FAILED",
            "The document could not be downloaded.",
            retryable=True,
        ) from None
    finally:
        if owns_client:
            await client.aclose()

    data = b"".join(chunks)
    if len(data) != event.file.size_bytes:
        raise ContentProcessingError(
            "FILE_SIZE_MISMATCH",
            "The downloaded file does not match its verified metadata.",
        )
    return data


async def extract_request_content(
    event: ClassificationRequestedEvent,
    settings: Settings,
    ocr_provider: OcrProvider | None = None,
    http_client: httpx.AsyncClient | None = None,
) -> ExtractedContent:
    if event.file.size_bytes > settings.max_upload_bytes:
        raise ContentProcessingError(
            "FILE_TOO_LARGE",
            "The uploaded file exceeds the processing limit.",
        )
    data = await _download_document(event, settings, http_client)
    probe = probe_file(
        data,
        event.file.file_name,
        event.file.mime_type,
        settings.max_upload_bytes,
    )

    provider = (
        ocr_provider
        if ocr_provider is not None
        else RapidOcrProvider(settings.ocr_cpu_threads)
    )
    return await extract_document(data, probe, settings, provider)
