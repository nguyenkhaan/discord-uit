import asyncio
import re
import xml.etree.ElementTree as ElementTree
from dataclasses import dataclass
from io import BytesIO
from typing import Literal, cast
from zipfile import BadZipFile, ZipFile

import pymupdf

from src.config.setting import Settings
from src.content.file_probe import ContentProcessingError, FileProbe
from src.content.ocr_policy import needs_ocr
from src.content.pdf_ocr import OcrProvider, ocr_pdf_pages

TextSource = Literal["direct", "pdf_text", "ocr", "mixed"]


@dataclass(frozen=True)
class ExtractedContent:
    text: str
    source: TextSource
    needs_ocr: bool
    page_count: int


def _bounded_text(text: str, settings: Settings) -> str:
    text = text.replace("\x00", "").strip()
    if len(text) > settings.max_extracted_text_chars:
        raise ContentProcessingError(
            "TEXT_TOO_LONG",
            "Extracted text exceeds the processing limit.",
        )
    return text


def _read_pdf_text(data: bytes, settings: Settings) -> tuple[list[str], list[int]]:
    try:
        with pymupdf.open(stream=data, filetype="pdf") as document:
            if document.is_encrypted:
                raise ContentProcessingError("ENCRYPTED_FILE", "Encrypted PDFs are not supported.")
            page_count = document.page_count
            if page_count < 1:
                raise ContentProcessingError("CORRUPT_FILE", "The PDF contains no pages.")
            if page_count > settings.max_pdf_pages:
                raise ContentProcessingError(
                    "PDF_PAGE_LIMIT_EXCEEDED",
                    "The PDF exceeds the page processing limit.",
                )

            pages: list[str] = []
            ocr_pages: list[int] = []
            total_chars = 0
            for page_number in range(page_count):
                page_text = cast(
                    str,
                    document.load_page(page_number).get_text("text", sort=True),
                ).strip()
                total_chars += len(page_text)
                if total_chars > settings.max_extracted_text_chars:
                    raise ContentProcessingError(
                        "TEXT_TOO_LONG",
                        "Extracted text exceeds the processing limit.",
                    )
                pages.append(page_text)
                if needs_ocr(
                    page_text,
                    settings.pdf_min_alnum_chars_per_page,
                    settings.pdf_min_alnum_ratio,
                ):
                    ocr_pages.append(page_number)
            return pages, ocr_pages
    except ContentProcessingError:
        raise
    except Exception:
        raise ContentProcessingError("CORRUPT_FILE", "The PDF document could not be read.") from None


def _read_ooxml(data: bytes, kind: Literal["docx", "pptx"], settings: Settings) -> str:
    try:
        with ZipFile(BytesIO(data)) as archive:
            entries = archive.infolist()
            if len(entries) > 1_000 or sum(entry.file_size for entry in entries) > settings.max_archive_expanded_bytes:
                raise ContentProcessingError(
                    "ARCHIVE_TOO_LARGE",
                    "The Office document exceeds the extraction limit.",
                )
            if kind == "docx":
                xml_files = ["word/document.xml"]
            else:
                xml_files = sorted(
                    (
                        name
                        for name in archive.namelist()
                        if re.fullmatch(r"ppt/slides/slide\d+\.xml", name)
                    ),
                    key=_slide_number,
                )
                if not xml_files:
                    raise ContentProcessingError("CORRUPT_FILE", "The presentation has no slides.")

            parts: list[str] = []
            total_chars = 0
            for xml_file in xml_files:
                root = ElementTree.fromstring(archive.read(xml_file))
                part = " ".join(root.itertext()).strip()
                total_chars += len(part)
                if total_chars > settings.max_extracted_text_chars:
                    raise ContentProcessingError(
                        "TEXT_TOO_LONG",
                        "Extracted text exceeds the processing limit.",
                    )
                if part:
                    parts.append(part)
            return "\n".join(parts)
    except ContentProcessingError:
        raise
    except (BadZipFile, OSError, KeyError, ElementTree.ParseError):
        raise ContentProcessingError("CORRUPT_FILE", "The Office document could not be read.") from None


def _slide_number(name: str) -> int:
    match = re.fullmatch(r"ppt/slides/slide(\d+)\.xml", name)
    if match is None:
        raise ValueError("Invalid slide filename.")
    return int(match.group(1))


async def extract_document(
    data: bytes,
    probe: FileProbe,
    settings: Settings,
    ocr_provider: OcrProvider | None = None,
) -> ExtractedContent:
    if probe.kind == "txt":
        try:
            text = data.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise ContentProcessingError("CORRUPT_FILE", "The text file is not valid UTF-8.") from None
        return ExtractedContent(_bounded_text(text, settings), "direct", False, 1)

    if probe.kind == "docx" or probe.kind == "pptx":
        text = await asyncio.to_thread(_read_ooxml, data, probe.kind, settings)
        return ExtractedContent(_bounded_text(text, settings), "direct", False, 0)

    page_texts, ocr_pages = await asyncio.to_thread(_read_pdf_text, data, settings)
    if not ocr_pages:
        text = _bounded_text("\n\n".join(page_texts), settings)
        return ExtractedContent(text, "pdf_text", False, len(page_texts))

    if len(ocr_pages) > settings.max_ocr_pages:
        raise ContentProcessingError(
            "OCR_PAGE_LIMIT_EXCEEDED",
            "The scanned document exceeds the OCR page limit.",
        )
    ocr_page_set = set(ocr_pages)
    direct_text_chars = sum(
        len(text) for page_number, text in enumerate(page_texts) if page_number not in ocr_page_set
    )
    recognized = await ocr_pdf_pages(
        data,
        ocr_pages,
        settings,
        ocr_provider,
        initial_text_chars=direct_text_chars,
    )
    for page_number, text in recognized.items():
        page_texts[page_number] = text.strip()

    text = _bounded_text("\n\n".join(page_texts), settings)
    source: TextSource = "ocr" if len(ocr_pages) == len(page_texts) else "mixed"
    return ExtractedContent(text, source, True, len(page_texts))
