import unittest
from zipfile import ZIP_DEFLATED, ZipFile
from io import BytesIO

from src.content.file_probe import ContentProcessingError, probe_file


def make_ooxml(entries: dict[str, bytes]) -> bytes:
    output = BytesIO()
    with ZipFile(output, "w", ZIP_DEFLATED) as archive:
        for name, content in entries.items():
            archive.writestr(name, content)
    return output.getvalue()


class FileProbeTests(unittest.TestCase):
    def test_detects_pdf_from_signature(self) -> None:
        result = probe_file(b"%PDF-1.7\nbody", "record.pdf", "application/pdf", 1024)

        self.assertEqual(result.kind, "pdf")

    def test_detects_docx_from_ooxml_entries(self) -> None:
        data = make_ooxml({"[Content_Types].xml": b"<Types/>", "word/document.xml": b"<w:document/>"})

        result = probe_file(data, "notes.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 1024)

        self.assertEqual(result.kind, "docx")

    def test_rejects_corrupt_archive_and_size_over_limit(self) -> None:
        with self.assertRaises(ContentProcessingError) as corrupt:
            probe_file(b"PK\x03\x04broken", "bad.docx", "application/octet-stream", 1024)
        with self.assertRaises(ContentProcessingError) as oversized:
            probe_file(b"%PDF-1.7", "large.pdf", "application/pdf", 4)

        self.assertEqual(corrupt.exception.code, "CORRUPT_FILE")
        self.assertEqual(oversized.exception.code, "FILE_TOO_LARGE")

