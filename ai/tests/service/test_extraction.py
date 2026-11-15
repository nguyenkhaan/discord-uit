from io import BytesIO
import pytest
from docx import Document
from pypdf import PdfWriter
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject

import src.service.extraction as extraction_module
from src.service.extraction import DocumentTooLarge, NoExtractableText, TooManyPdfPages, UnsupportedDocument, extract_text
from src.harness.local_ocr import OcrPageLimitError


def make_pdf_with_text(text: str) -> bytes:
    writer = PdfWriter()
    page = writer.add_blank_page(width=200, height=200)
    font = DictionaryObject(
        {
            NameObject("/Type"): NameObject("/Font"),
            NameObject("/Subtype"): NameObject("/Type1"),
            NameObject("/BaseFont"): NameObject("/Helvetica"),
        }
    )
    page[NameObject("/Resources")] = DictionaryObject(
        {NameObject("/Font"): DictionaryObject({NameObject("/F1"): writer._add_object(font)})}
    )
    content = DecodedStreamObject()
    content.set_data(f"BT /F1 12 Tf 20 100 Td ({text}) Tj ET".encode("ascii"))
    page[NameObject("/Contents")] = writer._add_object(content)
    output = BytesIO()
    writer.write(output)
    return output.getvalue()


def make_docx_with_text(text: str) -> bytes:
    document = Document()
    document.add_paragraph(text)
    output = BytesIO()
    document.save(output)
    return output.getvalue()


def make_docx_with_table(text: str) -> bytes:
    document = Document()
    table = document.add_table(rows=1, cols=1)
    table.cell(0, 0).text = text
    output = BytesIO()
    document.save(output)
    return output.getvalue()


@pytest.mark.parametrize(
    ("filename", "content", "expected_text"),
    [
        ("notes.TXT", "Tài liệu Vật lý".encode(), "Tài liệu Vật lý"),
        ("lesson.MD", "# Algebra\nQuadratic equations".encode(), "Quadratic equations"),
        ("physics.pdf", make_pdf_with_text("Physics notes"), "Physics notes"),
        ("report.docx", make_docx_with_text("Student project"), "Student project"),
    ],
)
def test_extract_text_supports_allowed_extensions(filename: str, content: bytes, expected_text: str) -> None:
    document = extract_text(filename, content, max_bytes=1_000_000)

    assert expected_text in document.text
    assert document.filename == filename


def test_extract_text_rejects_unsupported_extension() -> None:
    with pytest.raises(UnsupportedDocument, match="Unsupported"):
        extract_text("presentation.pptx", b"content", max_bytes=1_000_000)


def test_extract_text_rejects_oversized_upload_before_parsing(monkeypatch: pytest.MonkeyPatch) -> None:
    def parser_must_not_run(_: bytes) -> str:
        raise AssertionError("parser should not run")

    monkeypatch.setattr(extraction_module, "_extract_plain_text", parser_must_not_run)

    with pytest.raises(DocumentTooLarge, match="maximum"):
        extract_text("notes.txt", b"12345", max_bytes=4)


@pytest.mark.parametrize("content", [b"not a docx", b"PK\x05\x06" + b"\x00" * 18])
def test_extract_text_normalizes_malformed_docx(content: bytes) -> None:
    with pytest.raises(NoExtractableText, match="DOCX could not be read"):
        extract_text("broken.docx", content, max_bytes=1_000_000)


def test_extract_text_includes_table_only_docx_content() -> None:
    document = extract_text("grades.docx", make_docx_with_table("Student grade: A"), max_bytes=1_000_000)

    assert "Student grade: A" in document.text


class FakeOcrClient:
    def __init__(self, text: str = "OCR text") -> None:
        self.text = text
        self.calls: list[tuple[bytes, int, int]] = []

    def extract_pdf_text(self, content: bytes, *, max_pages: int, render_dpi: int) -> str:
        self.calls.append((content, max_pages, render_dpi))
        return self.text


def blank_pdf() -> bytes:
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    output = BytesIO()
    writer.write(output)
    return output.getvalue()


def multi_page_pdf(page_count: int) -> bytes:
    writer = PdfWriter()
    for _ in range(page_count):
        writer.add_blank_page(width=200, height=200)
    output = BytesIO()
    writer.write(output)
    return output.getvalue()


def test_extract_text_uses_ocr_for_pdf_without_text() -> None:
    ocr = FakeOcrClient("Tài liệu quét về trí tuệ nhân tạo")

    document = extract_text(
        "scanned.pdf", blank_pdf(), max_bytes=1_000_000, ocr_client=ocr, max_ocr_pages=4, ocr_render_dpi=200
    )

    assert document.text == "Tài liệu quét về trí tuệ nhân tạo"
    assert len(ocr.calls) == 1
    assert ocr.calls[0][1:] == (4, 200)


def test_extract_text_bypasses_ocr_when_pdf_has_text() -> None:
    ocr = FakeOcrClient()

    document = extract_text("text.pdf", make_pdf_with_text("Native PDF text"), max_bytes=1_000_000, ocr_client=ocr)

    assert "Native PDF text" in document.text
    assert ocr.calls == []


def test_extract_text_rejects_pdf_when_ocr_finds_no_text() -> None:
    with pytest.raises(NoExtractableText, match="OCR could not recover"):
        extract_text("scanned.pdf", blank_pdf(), max_bytes=1_000_000, ocr_client=FakeOcrClient(""))


def test_extract_text_rejects_pdf_above_ocr_page_limit() -> None:
    class PageLimitedOcr:
        def extract_pdf_text(self, content: bytes, *, max_pages: int, render_dpi: int) -> str:
            raise OcrPageLimitError("too many pages")

    with pytest.raises(NoExtractableText, match="maximum OCR page limit"):
        extract_text("scanned.pdf", blank_pdf(), max_bytes=1_000_000, ocr_client=PageLimitedOcr(), max_ocr_pages=1)


def test_extract_text_rejects_pdf_above_page_limit_before_ocr() -> None:
    with pytest.raises(TooManyPdfPages, match="maximum PDF page limit"):
        extract_text("many-pages.pdf", multi_page_pdf(2), max_bytes=1_000_000, max_pdf_pages=1)
