import argparse
import asyncio
from pathlib import Path

from src.agentic.ocr_ai import TesseractOcrProvider
from src.config.setting import Settings
from src.content.file_probe import probe_file
from src.content.text_extractors import extract_document

DEFAULT_PDF = Path("/home/cloud/workspace/project/webapp/se347-project/app/ai/scripts/sample_pdf.pdf")


async def extract_pdf(path: Path) -> None:
    data = path.read_bytes()
    settings = Settings()
    probe = probe_file(data, path.name, "application/pdf", settings.max_upload_bytes)
    result = await extract_document(data, probe, settings, TesseractOcrProvider(settings))

    print({"source": result.source, "needs_ocr": result.needs_ocr, "page_count": result.page_count})
    print(result.text[:500])


def main() -> None:
    parser = argparse.ArgumentParser(description="Manually extract text from a PDF.")
    parser.add_argument("path", nargs="?", type=Path, default=DEFAULT_PDF)
    args = parser.parse_args()

    if not args.path.is_file():
        parser.error(f"PDF file not found: {args.path}")

    asyncio.run(extract_pdf(args.path))


if __name__ == "__main__":
    main()
