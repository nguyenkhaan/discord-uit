import sys
from types import SimpleNamespace

import numpy as np

from src.harness.local_ocr import OcrPageSizeError, PaddleOcrClient


def test_paddle_client_initializes_vietnamese_cpu_engine_lazily(monkeypatch) -> None:
    created_with: dict[str, object] = {}

    class FakePaddleOcr:
        def __init__(self, **kwargs: object) -> None:
            created_with.update(kwargs)

    monkeypatch.setitem(sys.modules, "paddleocr", SimpleNamespace(PaddleOCR=FakePaddleOcr))
    client = PaddleOcrClient(cpu_threads=2)

    assert client.engine_is_loaded is False
    client._get_engine()

    assert client.engine_is_loaded is True
    assert created_with == {
        "lang": "vi",
        "device": "cpu",
        "use_doc_orientation_classify": False,
        "use_doc_unwarping": False,
        "use_textline_orientation": False,
        "enable_mkldnn": False,
        "cpu_threads": 2,
    }


def test_paddle_client_passes_rendered_page_as_numpy_image(monkeypatch) -> None:
    received: list[object] = []

    class FakeEngine:
        def predict(self, image: object) -> list[object]:
            received.append(image)
            return [SimpleNamespace(json={"res": {"rec_texts": ["Scanned lesson"]}})]

    class FakePixmap:
        width = 2
        height = 1
        n = 3
        samples = b"\x00\x01\x02\x03\x04\x05"

    class FakePage:
        rect = SimpleNamespace(width=1, height=1)

        def get_pixmap(self, *, dpi: int, alpha: bool) -> FakePixmap:
            assert (dpi, alpha) == (200, False)
            return FakePixmap()

    class FakeDocument:
        def __enter__(self) -> "FakeDocument":
            return self

        def __exit__(self, *args: object) -> None:
            return None

        def __len__(self) -> int:
            return 1

        def __iter__(self):
            return iter([FakePage()])

    monkeypatch.setitem(sys.modules, "pymupdf", SimpleNamespace(open=lambda **_: FakeDocument()))
    client = PaddleOcrClient()
    client._engine = FakeEngine()

    assert client.extract_pdf_text(b"pdf", max_pages=1, render_dpi=200) == "Scanned lesson"
    assert len(received) == 1
    assert isinstance(received[0], np.ndarray)
    assert received[0].shape == (1, 2, 3)


def test_paddle_client_rejects_an_oversized_page_before_rendering(monkeypatch) -> None:
    class FakePage:
        rect = SimpleNamespace(width=1_000, height=1_000)

        def get_pixmap(self, **kwargs: object) -> object:
            raise AssertionError("oversized page must not be rendered")

    class FakeDocument:
        def __enter__(self) -> "FakeDocument":
            return self

        def __exit__(self, *args: object) -> None:
            return None

        def __len__(self) -> int:
            return 1

        def __iter__(self):
            return iter([FakePage()])

    monkeypatch.setitem(sys.modules, "pymupdf", SimpleNamespace(open=lambda **_: FakeDocument()))
    client = PaddleOcrClient(max_pixels_per_page=100)
    client._engine = object()

    with __import__("pytest").raises(OcrPageSizeError, match="pixel limit"):
        client.extract_pdf_text(b"pdf", max_pages=1, render_dpi=200)
