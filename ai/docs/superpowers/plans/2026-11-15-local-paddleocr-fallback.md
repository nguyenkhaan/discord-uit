# Local PaddleOCR Fallback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a CPU-only, local PaddleOCR fallback for image-only PDFs while preserving the existing text-PDF path.

**Architecture:** `extraction.py` first reads the PDF text layer with `pypdf`. Only an empty result calls a lazy PaddleOCR harness, which renders up to ten PDF pages with PyMuPDF in memory and returns joined OCR text to the existing pipeline.

**Tech Stack:** FastAPI, pypdf, PyMuPDF, PaddlePaddle/PaddleOCR, pytest.

**Spec:** `docs/superpowers/specs/2026-11-15-local-paddleocr-fallback-design.md`

## Global Constraints

- OCR is local CPU-only and only applies to image-only PDFs.
- No OCR output, rendered page, upload, or result is persisted.
- Default OCR limits are 10 pages and 200 DPI.
- OCR model loading is lazy; startup must not download or initialize OCR models.
- Do not commit: the user owns git commits.

## Review Focus

- Text-based PDFs must not invoke OCR.
- Image-only PDFs must invoke OCR once per page within the configured page bound.
- Empty/failed OCR must display the existing safe same-page extraction error.
- A PDF over the page bound must not be partially classified.
- Application startup remains independent of PaddleOCR model availability.

### Task 1: Add the local OCR harness and extraction fallback

**Files:**
- Create: `src/harness/local_ocr.py`, `tests/harness/test_local_ocr.py`
- Modify: `src/service/extraction.py`, `tests/service/test_extraction.py`, `pyproject.toml`, `uv.lock`

**Interfaces:**
- Produces: `OcrClient.extract_pdf_text(content: bytes, *, max_pages: int, render_dpi: int) -> str`.
- Consumes: optional `ocr_client`, `max_ocr_pages`, and `ocr_render_dpi` in `extract_text`.

**Acceptance Criteria:** direct text PDFs bypass OCR; image-only PDFs return fake OCR text; empty OCR and page-limit errors become `NoExtractableText`.

- [ ] **Step 1: Write failing harness/extraction tests** for CPU Paddle client construction contract, fallback, bypass, empty result, and page cap.
- [ ] **Step 2: Run targeted tests and verify RED.**
- [ ] **Step 3: Add pinned-compatible OCR/render dependencies and implement the lazy local OCR harness plus extraction fallback.**
- [ ] **Step 4: Run targeted tests and verify GREEN.**
- [ ] **Step 5: Commit `feat: add local PDF OCR fallback`.**

### Task 2: Wire configuration and the web service

**Files:**
- Modify: `src/config/settings.py`, `src/app.py`, `src/route/analyze.py`, `tests/route/test_analyze.py`, `tests/integration/test_startup.py`, `.env.example`, `README.md`

**Interfaces:**
- Consumes: `PaddleOcrClient` and `Settings.max_ocr_pages` / `Settings.ocr_render_dpi`.
- Produces: application services that defer OCR model initialization until an image-only PDF is uploaded.

**Acceptance Criteria:** configured OCR fallback reaches analysis; startup does not call the OCR engine; OCR failure stays a safe HTTP 400 page response.

- [ ] **Step 1: Write failing route/startup tests for OCR service wiring and lazy model initialization.**
- [ ] **Step 2: Run targeted tests and verify RED.**
- [ ] **Step 3: Wire OCR settings and service dependency, update local-operation documentation.**
- [ ] **Step 4: Run focused and complete test suite; start `uv run main.py` and request `/health`.**
- [ ] **Step 5: Commit `feat: wire local OCR fallback`.**
