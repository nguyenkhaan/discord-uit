import math
import threading
from typing import Any, Protocol

import numpy as np


class OcrError(RuntimeError):
    pass


class OcrPageLimitError(OcrError):
    pass


class OcrPageSizeError(OcrError):
    pass


class OcrClient(Protocol):
    def extract_pdf_text(self, content: bytes, *, max_pages: int, render_dpi: int) -> str: ...


class PaddleOcrClient:
    def __init__(self, cpu_threads: int = 2, max_pixels_per_page: int = 20_000_000) -> None:
        if cpu_threads <= 0 or max_pixels_per_page <= 0:
            raise ValueError("cpu_threads and max_pixels_per_page must be positive")
        self._engine: Any | None = None
        self._cpu_threads = cpu_threads
        self._max_pixels_per_page = max_pixels_per_page
        self._inference_lock = threading.Lock()

    @property
    def engine_is_loaded(self) -> bool:
        return self._engine is not None

    def _get_engine(self) -> Any:
        if self._engine is None:
            try:
                from paddleocr import PaddleOCR

                self._engine = PaddleOCR(
                    lang="vi",
                    device="cpu",
                    use_doc_orientation_classify=False,
                    use_doc_unwarping=False,
                    use_textline_orientation=False,
                    enable_mkldnn=False,
                    cpu_threads=self._cpu_threads,
                )
            except Exception:
                raise OcrError("Local OCR engine could not be initialized") from None
        return self._engine

    def extract_pdf_text(self, content: bytes, *, max_pages: int, render_dpi: int) -> str:
        if max_pages <= 0 or render_dpi <= 0:
            raise ValueError("max_pages and render_dpi must be positive")
        try:
            import pymupdf

            with pymupdf.open(stream=content, filetype="pdf") as document:
                if len(document) > max_pages:
                    raise OcrPageLimitError(f"PDF exceeds the maximum OCR page limit of {max_pages}")
                engine = self._get_engine()
                page_text = []
                for page in document:
                    if _rendered_pixel_count(page, render_dpi) > self._max_pixels_per_page:
                        raise OcrPageSizeError("PDF page exceeds the maximum OCR pixel limit")
                    pixmap = page.get_pixmap(dpi=render_dpi, alpha=False)
                    image = np.frombuffer(pixmap.samples, dtype=np.uint8).reshape(pixmap.height, pixmap.width, pixmap.n)
                    with self._inference_lock:
                        page_text.extend(_prediction_text(result) for result in engine.predict(image))
                return "\n".join(text for text in page_text if text.strip())
        except OcrPageLimitError:
            raise
        except OcrError:
            raise
        except Exception:
            raise OcrError("Local OCR could not process this PDF") from None


def _prediction_text(result: Any) -> str:
    payload = getattr(result, "json", result)
    if not isinstance(payload, dict):
        return ""
    output = payload.get("res", payload)
    if not isinstance(output, dict):
        return ""
    texts = output.get("rec_texts", [])
    return "\n".join(str(text).strip() for text in texts if str(text).strip()) if isinstance(texts, list) else ""


def _rendered_pixel_count(page: Any, render_dpi: int) -> int:
    rect = page.rect
    width = math.ceil(rect.width * render_dpi / 72)
    height = math.ceil(rect.height * render_dpi / 72)
    return width * height
