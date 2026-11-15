from dataclasses import dataclass
from io import BytesIO
from pathlib import PurePath
from zipfile import BadZipFile

from docx import Document
from docx.opc.exceptions import PackageNotFoundError
from docx.table import Table
from docx.text.paragraph import Paragraph
from lxml.etree import XMLSyntaxError
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from src.harness.local_ocr import OcrClient, OcrError, OcrPageLimitError

class ExtractionError(ValueError):
    pass


class UnsupportedDocument(ExtractionError):
    pass


class DocumentTooLarge(ExtractionError):
    pass


class TooManyPdfPages(ExtractionError):
    pass


class NoExtractableText(ExtractionError):
    pass


@dataclass(frozen=True)
class ExtractedDocument:
    filename: str
    text: str


def extract_text(
    filename: str,
    content: bytes,
    max_bytes: int,
    *,
    ocr_client: OcrClient | None = None,
    max_ocr_pages: int = 10,
    ocr_render_dpi: int = 200,
    max_pdf_pages: int = 100,
) -> ExtractedDocument:
    if len(content) > max_bytes:
        raise DocumentTooLarge(f"Document exceeds the maximum upload size of {max_bytes} bytes")

    extension = PurePath(filename).suffix.lower()
    if extension not in {".txt", ".md", ".pdf", ".docx"}:
        raise UnsupportedDocument(f"Unsupported document type: {extension or 'no extension'}")

    if extension in {".txt", ".md"}:
        text = _extract_plain_text(content)
    elif extension == ".pdf":
        text = _extract_pdf_text(content, max_pdf_pages)
        if not text.strip() and ocr_client is not None:
            text = _extract_pdf_ocr_text(content, ocr_client, max_ocr_pages, ocr_render_dpi)
    else:
        text = _extract_docx_text(content)

    normalized = text.strip()
    if not normalized:
        if extension == ".pdf":
            raise NoExtractableText("PDF has no extractable text and OCR could not recover readable content")
        raise NoExtractableText("Document has no extractable text")
    return ExtractedDocument(filename=filename, text=normalized)


def _extract_plain_text(content: bytes) -> str:
    try:
        return content.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise NoExtractableText("Text documents must use UTF-8 encoding") from error


def _extract_pdf_text(content: bytes, max_pages: int) -> str:
    try:
        reader = PdfReader(BytesIO(content))
        if len(reader.pages) > max_pages:
            raise TooManyPdfPages(f"PDF exceeds the maximum PDF page limit of {max_pages}")
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except PdfReadError as error:
        raise NoExtractableText("PDF could not be read") from error


def _extract_pdf_ocr_text(content: bytes, client: OcrClient, max_pages: int, render_dpi: int) -> str:
    try:
        return client.extract_pdf_text(content, max_pages=max_pages, render_dpi=render_dpi)
    except OcrPageLimitError as error:
        raise NoExtractableText("PDF exceeds the maximum OCR page limit") from error
    except OcrError as error:
        raise NoExtractableText("PDF OCR could not recover readable text") from error


def _extract_docx_text(content: bytes) -> str:
    try:
        document = Document(BytesIO(content))
    except (BadZipFile, KeyError, OSError, PackageNotFoundError, ValueError, XMLSyntaxError) as error:
        raise NoExtractableText("DOCX could not be read") from error
    return "\n".join(_iter_container_text(document))


def _iter_container_text(container: object) -> list[str]:
    values: list[str] = []
    for block in container.iter_inner_content():  # type: ignore[attr-defined]
        if isinstance(block, Paragraph):
            values.append(block.text)
        elif isinstance(block, Table):
            for row in block.rows:
                for cell in row.cells:
                    values.extend(_iter_container_text(cell))
    return values
