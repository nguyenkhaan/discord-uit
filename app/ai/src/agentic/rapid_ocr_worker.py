import contextlib
import io
import json
import sys

import cv2
import numpy as np
from rapidocr import ModelType, OCRVersion, RapidOCR

MAX_IMAGE_BYTES = 128 * 1024 * 1024


def create_ocr_engine(cpu_threads: int) -> RapidOCR:
    return RapidOCR(
        params={
            "Det.ocr_version": OCRVersion.PPOCRV6,
            "Det.model_type": ModelType.SMALL,
            "Det.lang_type": "vi",
            "Rec.ocr_version": OCRVersion.PPOCRV6,
            "Rec.model_type": ModelType.SMALL,
            "Rec.lang_type": "vi",
            "EngineConfig.onnxruntime.intra_op_num_threads": cpu_threads,
            "EngineConfig.onnxruntime.inter_op_num_threads": 1,
        }
    )


def recognize_page(engine: RapidOCR, image_bytes: bytes) -> list[str]:
    image = cv2.imdecode(np.frombuffer(image_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("The OCR input is not a supported image.")

    # Keep stdout reserved for the machine-readable response.
    with contextlib.redirect_stdout(io.StringIO()):
        result = engine(image)
    lines = getattr(result, "txts", None) or ()
    return [line for line in lines if isinstance(line, str) and line.strip()]


def read_exact(length: int) -> bytes:
    chunks: list[bytes] = []
    remaining = length
    while remaining:
        chunk = sys.stdin.buffer.read(remaining)
        if not chunk:
            break
        chunks.append(chunk)
        remaining -= len(chunk)
    return b"".join(chunks)


def main() -> int:
    try:
        cpu_threads = int(sys.argv[1]) if len(sys.argv) > 1 else 2
    except ValueError:
        return 1
    if not 1 <= cpu_threads <= 64:
        return 1

    try:
        with contextlib.redirect_stdout(io.StringIO()):
            engine = create_ocr_engine(cpu_threads)
    except Exception:
        return 1

    while True:
        header = read_exact(4)
        if not header:
            return 0
        if len(header) != 4:
            return 1

        image_length = int.from_bytes(header, byteorder="big")
        if image_length <= 0 or image_length > MAX_IMAGE_BYTES:
            return 1
        image_bytes = read_exact(image_length)
        if len(image_bytes) != image_length:
            return 1

        try:
            lines = recognize_page(engine, image_bytes)
            response = {"lines": lines}
        except Exception:
            response = {"error": "OCR_PROVIDER_ERROR"}
        sys.stdout.buffer.write(
            json.dumps(response, ensure_ascii=False, separators=(",", ":")).encode("utf-8") + b"\n"
        )
        sys.stdout.buffer.flush()


if __name__ == "__main__":
    raise SystemExit(main())
