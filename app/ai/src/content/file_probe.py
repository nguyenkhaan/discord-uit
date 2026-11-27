from dataclasses import dataclass
from io import BytesIO
from typing import Literal
from zipfile import BadZipFile, ZipFile

FileKind = Literal["pdf", "docx", "pptx", "txt"]


class ContentProcessingError(Exception):
    def __init__(self, code: str, safe_message: str, retryable: bool = False) -> None:
        super().__init__(safe_message)
        self.code = code
        self.safe_message = safe_message
        self.retryable = retryable


@dataclass(frozen=True)
class FileProbe:
    kind: FileKind
    mime_type: str


_DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
_PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation"


def probe_file(data: bytes, file_name: str, mime_type: str, max_bytes: int) -> FileProbe:
    if not data:
        raise ContentProcessingError("EMPTY_FILE", "The uploaded file is empty.")
    if len(data) > max_bytes:
        raise ContentProcessingError("FILE_TOO_LARGE", "The uploaded file exceeds the processing limit.")

    name = file_name.lower()
    declared_type = mime_type.split(";", maxsplit=1)[0].strip().lower()
    if b"%PDF-" in data[:1024]:
        if not name.endswith(".pdf") or declared_type not in {"application/pdf", "application/octet-stream"}:
            raise ContentProcessingError("FILE_TYPE_MISMATCH", "The file type does not match its metadata.")
        return FileProbe("pdf", "application/pdf")

    if data.startswith((b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08")):
        try:
            with ZipFile(BytesIO(data)) as archive:
                names = set(archive.namelist())
        except (BadZipFile, OSError):
            raise ContentProcessingError("CORRUPT_FILE", "The uploaded document is corrupt.") from None

        if "[Content_Types].xml" in names and "word/document.xml" in names:
            if not name.endswith(".docx") or declared_type not in {_DOCX_MIME, "application/octet-stream"}:
                raise ContentProcessingError("FILE_TYPE_MISMATCH", "The file type does not match its metadata.")
            return FileProbe("docx", _DOCX_MIME)
        if "[Content_Types].xml" in names and "ppt/presentation.xml" in names:
            if not name.endswith(".pptx") or declared_type not in {_PPTX_MIME, "application/octet-stream"}:
                raise ContentProcessingError("FILE_TYPE_MISMATCH", "The file type does not match its metadata.")
            return FileProbe("pptx", _PPTX_MIME)
        raise ContentProcessingError("UNSUPPORTED_FILE_TYPE", "This document format is not supported.")

    if name.endswith(".txt") and declared_type in {"text/plain", "application/octet-stream"}:
        try:
            decoded = data.decode("utf-8-sig")
        except UnicodeDecodeError:
            raise ContentProcessingError("CORRUPT_FILE", "The text file is not valid UTF-8.") from None
        if "\x00" in decoded:
            raise ContentProcessingError("CORRUPT_FILE", "The text file contains invalid binary data.")
        return FileProbe("txt", "text/plain")

    raise ContentProcessingError("UNSUPPORTED_FILE_TYPE", "This document format is not supported.")
