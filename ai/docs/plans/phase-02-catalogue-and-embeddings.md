# Document Classifier — Phase 02: Catalogue and Embedding Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate `data.json`, build searchable catalogue entries, and persist reusable Gemini embedding vectors locally.

**Architecture:** `data/data.json` remains authoritative. Cache records are keyed by model ID and SHA-256 of canonical tag/collection text; valid records load to RAM and only changed records call Gemini.

**Tech Stack:** Pydantic, Gemini API client, SHA-256, NumPy or standard-library cosine math, pytest.

**Spec:** `docs/superpowers/specs/2026-11-15-document-classifier-design.md`

## Global Constraints

- Tags: `id`, `name`, `slug`, `description`; collections additionally have `keywords`.
- Use Gemini Embedding 2; no document embeddings persist to disk.
- Cache lives under `ai/cache/`; only derived catalogue vectors persist.
- Unchanged entries must not be embedded again after restart.

## Review Focus

- Duplicate IDs/slugs are rejected before provider calls; test in Task 1.
- A changed description invalidates only that entry’s cache record; test in Task 2.
- Corrupt cache rebuilds safely; test in Task 2.

---

### Task 1: Define and load the catalogue contract

**Files:**
- Create: `ai/data/contract.py`, `ai/data/data.json`, `ai/src/service/catalogue.py`, `ai/tests/service/test_catalogue.py`

**Interfaces:**
- Produces: `Tag`, `Collection`, `Catalogue`; `load_catalogue(path: Path) -> Catalogue`; `canonical_text(entry: Tag | Collection) -> str`.

**Acceptance Criteria:** valid mixed Vietnamese/English values load; canonical text includes all required searchable fields; duplicates and malformed JSON yield actionable errors.

- [ ] **Step 1: Write failing loader, canonical-text, duplicate-ID, and duplicate-slug tests.**
- [ ] **Step 2: Run `uv run pytest tests/service/test_catalogue.py -v`; verify failure.**
- [ ] **Step 3: Implement Pydantic DTOs in `data/contract.py` and loader functions in `src/service/catalogue.py`.**
- [ ] **Step 4: Add a small valid sample `data/data.json`.**
- [ ] **Step 5: Run tests; verify PASS.**
- [ ] **Step 6: Commit `feat: add catalogue contract and loader`.**

### Task 2: Implement Gemini embedding and persistent catalogue cache

**Files:**
- Create: `ai/src/harness/gemini_embeddings.py`, `ai/src/service/catalogue_cache.py`, `ai/tests/service/test_catalogue_cache.py`

**Interfaces:**
- Produces: `EmbeddingClient.embed(texts: list[str]) -> list[list[float]]`; `load_or_build_index(catalogue: Catalogue) -> CatalogueIndex`; `CatalogueIndex.search(query_vector: list[float], kind: Literal["tag", "collection"], limit: int) -> list[RetrievedEntry]`.

**Acceptance Criteria:** cache metadata contains model ID and content hash; fake client proves only altered/new entries embed; cache read failures trigger rebuild.

- [ ] **Step 1: Write failing tests with a recording fake `EmbeddingClient`.**
- [ ] **Step 2: Run `uv run pytest tests/service/test_catalogue_cache.py -v`; verify failure.**
- [ ] **Step 3: Implement the Gemini adapter and JSON cache read/write with atomic replacement.**
- [ ] **Step 4: Implement cosine ranking and deterministic tie-breaking by entry ID.**
- [ ] **Step 5: Run tests; verify PASS.**
- [ ] **Step 6: Commit `feat: cache catalogue embeddings`.**
