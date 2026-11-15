# Document Classifier — Phase 03: Document Extraction and Retrieval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract text from supported uploads and retrieve the best existing catalogue candidates without retaining uploads.

**Architecture:** Extraction receives bytes and a filename, validates type/size, then returns text. The retrieval service chunks bounded text, embeds only request-local chunks, and ranks tag and collection candidates from the in-memory index.

**Tech Stack:** FastAPI UploadFile, pypdf, python-docx, Gemini embedding client, pytest.

**Spec:** `docs/superpowers/specs/2026-11-15-document-classifier-design.md`

## Global Constraints

- Support `.txt`, `.md`, `.pdf`, `.docx`; reject image-only PDFs because OCR is out of scope.
- Upload text and document vectors are request-local and never written to `cache/`.
- Return top 8 tag candidates and top 5 collection candidates to the classifier.

## Review Focus

- Uppercase allowed extensions are accepted; test in Task 1.
- Empty and image-only PDFs return a clear OCR-not-supported/extraction error; test in Task 1.
- A document beyond the configured limit is rejected before embedding; test in Task 1.
- Long documents disclose that analysis was length-limited; test in Task 2.

---

### Task 1: Implement safe text extraction

**Files:**
- Create: `ai/src/service/extraction.py`, `ai/tests/service/test_extraction.py`, binary fixtures under `ai/tests/fixtures/`

**Interfaces:**
- Produces: `extract_text(filename: str, content: bytes, max_bytes: int) -> ExtractedDocument` and exceptions `UnsupportedDocument`, `DocumentTooLarge`, `NoExtractableText`.

**Acceptance Criteria:** every supported text-bearing format extracts Unicode text; errors distinguish unsupported extension, oversize, and no text.

- [ ] **Step 1: Write failing parametrized tests for TXT/MD/PDF/DOCX and the review-focus failures.**
- [ ] **Step 2: Run `uv run pytest tests/service/test_extraction.py -v`; verify failure.**
- [ ] **Step 3: Implement `extract_text` with format-specific parsers and explicit byte-size validation.**
- [ ] **Step 4: Run tests; verify PASS.**
- [ ] **Step 5: Commit `feat: extract supported document types`.**

### Task 2: Implement bounded semantic retrieval

**Files:**
- Create: `ai/src/service/retrieval.py`, `ai/tests/service/test_retrieval.py`

**Interfaces:**
- Consumes: `EmbeddingClient`, `CatalogueIndex`.
- Produces: `retrieve_candidates(document: ExtractedDocument, index: CatalogueIndex) -> RetrievalResult` with `tags`, `collections`, and `was_truncated`.

**Acceptance Criteria:** chunk vectors remain request-local; strongest chunk similarity ranks entries; output limits are exactly 8 tags and 5 collections.

- [ ] **Step 1: Write failing fake-embedding tests for ranking, caps, and truncation flag.**
- [ ] **Step 2: Run `uv run pytest tests/service/test_retrieval.py -v`; verify failure.**
- [ ] **Step 3: Implement deterministic chunking and `retrieve_candidates`.**
- [ ] **Step 4: Run tests; verify PASS.**
- [ ] **Step 5: Commit `feat: retrieve catalogue candidates for uploads`.**
