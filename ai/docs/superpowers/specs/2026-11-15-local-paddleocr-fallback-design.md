# Local PaddleOCR fallback design

## Intent

Allow the local document classifier to process scanned, image-only PDFs without sending document pages to an OCR API. Existing text-based PDF extraction remains the fast default path.

## Goals

- Attempt direct `pypdf` extraction first.
- When a PDF has no extractable text, render a bounded number of pages locally and run PaddleOCR on CPU.
- Use Vietnamese OCR language support, which also covers the MVP's Vietnamese/English documents.
- Return the OCR text through the existing embedding and classification pipeline without persisting the upload, page images, or OCR text.
- Give a clear same-page error when OCR cannot recover readable text or a PDF exceeds the OCR page limit.

## Non-goals

- OCR for image uploads, DOCX embedded images, handwriting guarantees, table reconstruction, background jobs, GPU support, or API-based OCR.
- Persisting OCR text or producing an OCR-enhanced PDF.

## Approaches

1. Cloud OCR API: low local setup but sends document pages externally and adds provider cost/configuration.
2. Local PaddleOCR fallback (chosen): preserves the local MVP/privacy posture, supports Vietnamese, and only spends CPU for scanned PDFs.
3. OCR every PDF: rejected because text-based PDFs already have a faster, more faithful text layer.

## Design

- Add `paddleocr`, `paddlepaddle`, and PyMuPDF dependencies. PyMuPDF renders each PDF page in memory at 200 DPI with no alpha channel; PaddleOCR runs with `device="cpu"`.
- `src/harness/local_ocr.py` exposes an `OcrClient` protocol and lazy `PaddleOcrClient`. Models are initialized on first OCR request, not app startup.
- `src/service/extraction.py` accepts an optional `ocr_client` and OCR settings. If direct PDF extraction is empty, it delegates to the local OCR client. Non-PDF handling is unchanged.
- Add `MAX_OCR_PAGES` (default `10`) and `OCR_RENDER_DPI` (default `200`) settings. A PDF above the page limit produces a safe user-facing extraction error rather than partial classification.
- Production services carry one lazily initialized OCR client; tests use a fake protocol implementation. OCR errors are normalized to `NoExtractableText` so the existing route displays its same-page 400 response.

## Validation

- Unit tests cover direct PDF extraction bypassing OCR, scanned-PDF OCR fallback, empty OCR output, and page-limit rejection.
- Route tests cover the readable OCR failure message; startup is verified not to load OCR models.
