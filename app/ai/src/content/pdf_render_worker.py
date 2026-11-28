import sys

from src.content.file_probe import ContentProcessingError
from src.content.pdf_ocr import _render_pdf_page_with_limits


def main() -> int:
    try:
        page_number = int(sys.argv[1])
        render_dpi = int(sys.argv[2])
        max_pixels = int(sys.argv[3])
        pdf_bytes = sys.stdin.buffer.read()
        image_bytes = _render_pdf_page_with_limits(
            pdf_bytes,
            page_number,
            render_dpi,
            max_pixels,
        )
    except ContentProcessingError as error:
        sys.stderr.write(error.code)
        return 1
    except Exception:
        sys.stderr.write("CORRUPT_FILE")
        return 1

    sys.stdout.buffer.write(image_bytes)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
