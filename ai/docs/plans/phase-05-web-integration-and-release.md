# Document Classifier — Phase 05: Web Integration and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the server-rendered upload experience, startup wiring, documentation, and end-to-end verification.

**Architecture:** A single Jinja page owns upload, processing, result, and error states. FastAPI lifespan initializes the validated catalogue and cache-backed in-memory index; request orchestration invokes extraction, retrieval, and classification.

**Tech Stack:** FastAPI, Jinja2, multipart uploads, pytest/httpx, uv.

**Spec:** `docs/superpowers/specs/2026-11-15-document-classifier-design.md`

## Global Constraints

- No login, history, result editing, vector database, OCR, Docker, or deployment work.
- Results show at most 3 tags and 2 collections with estimated confidence and one-sentence reason.
- New-tag/new-collection cards are display-only and visually separate.
- Raw uploads/results are not persisted; only derived catalogue cache is local.

## Review Focus

- Missing file and disallowed extension show an actionable same-page error; test in Task 1.
- Provider/configuration outage is visible without a traceback or secret; test in Task 1.
- Mixed English/Vietnamese result text renders safely; test in Task 1.
- Restart reuses unchanged cache and app remains responsive; test in Task 2.
- Documentation tells users that Gemini/LLM providers receive document content; test in Task 2.

---

### Task 1: Deliver the upload-to-result vertical slice

**Files:**
- Create: `ai/src/route/analyze.py`, `ai/templates/index.html`, `ai/static/app.css`, `ai/tests/route/test_analyze.py`
- Modify: `ai/src/app.py`

**Interfaces:**
- Consumes: `extract_text`, `retrieve_candidates`, `classify`.
- Produces: `GET /` upload page; `POST /analyze` rendered result/error response.

**Acceptance Criteria:** a successful fake-backed request renders tag/collection cards and confidence/reasons; each planned failure maps to user-readable HTML, not HTTP 500.

- [ ] **Step 1: Write route tests for success, no-file, unsupported file, extraction error, provider error, and mixed-language output.**
- [ ] **Step 2: Run `uv run pytest tests/route/test_analyze.py -v`; verify failure.**
- [ ] **Step 3: Implement templates, route orchestration, and exception-to-message mapping.**
- [ ] **Step 4: Run tests; verify PASS.**
- [ ] **Step 5: Commit `feat: add document analysis web experience`.**

### Task 2: Wire lifespan, verify the release, and document local operation

**Files:**
- Create: `ai/README.md`, `ai/tests/integration/test_startup.py`
- Modify: `ai/src/app.py`, `ai/.gitignore`, `ai/.env.example`

**Interfaces:**
- Consumes: `load_catalogue`, `load_or_build_index`, configured settings.
- Produces: FastAPI lifespan application state containing the catalogue index.

**Acceptance Criteria:** startup loads/reuses cache; `cache/` and `.env` are ignored; README covers setup, `uv run main.py`, port 5050, provider variables, privacy disclosure, supported types, and no-OCR limitation.

- [ ] **Step 1: Write startup tests proving valid cache reuse and corrupt-cache recovery with fake embedding client.**
- [ ] **Step 2: Run `uv run pytest tests/integration/test_startup.py -v`; verify failure.**
- [ ] **Step 3: Implement lifespan wiring and README/.gitignore updates.**
- [ ] **Step 4: Run `uv run pytest -v` and `uv run main.py`; verify all tests pass and `GET /health` is 200.**
- [ ] **Step 5: Manually upload one TXT, MD, text PDF, and DOCX using configured credentials; record pass/fail in the PR/hand-off.**
- [ ] **Step 6: Commit `feat: finalize local document classifier MVP`.**
