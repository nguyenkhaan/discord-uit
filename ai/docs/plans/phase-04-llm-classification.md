# Document Classifier — Phase 04: LLM Classification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Classify retrieved candidates through a configurable Groq harness and enforce safe structured results.

**Architecture:** A Groq harness returns raw JSON. Pydantic contracts validate it; the service permits only retrieved IDs, caps existing results, and applies the agreed LLM-confidence rules for new suggestions.

**Tech Stack:** httpx, Pydantic, Groq chat API, pytest.

**Spec:** `docs/superpowers/specs/2026-11-15-document-classifier-design.md`

## Global Constraints

- Groq model/key are environment configuration, not committed constants.
- Existing outputs max out at 3 tags and 2 collections.
- A new entry is visible only when LLM confidence is `>= 0.80` and every suitable existing candidate has LLM confidence `< 0.60`.
- Embedding similarity is retrieval-only, never displayed as confidence.

## Review Focus

- LLM returns an ID not retrieved: reject response; test in Task 2.
- Malformed JSON uses one repair attempt then gives a safe error; test in Task 1.
- New suggestion at 0.79 is omitted; test in Task 2.
- Provider timeout/key failure exposes no secrets; test in Task 1.

---

### Task 1: Implement the configurable LLM harness

**Files:**
- Create: `ai/src/harness/llm.py`, `ai/src/dto-contract/classification.py`, `ai/tests/harness/test_llm.py`

**Interfaces:**
- Produces: `LLMClient.classify(prompt: str) -> RawClassification`; `LLMProviderError`; `RawClassification` Pydantic schema.

**Acceptance Criteria:** the Groq adapter makes one repair call for invalid JSON; error messages do not leak keys.

- [ ] **Step 1: Write failing fake-transport tests for success, malformed response/repair, and timeout.**
- [ ] **Step 2: Run `uv run pytest tests/harness/test_llm.py -v`; verify failure.**
- [ ] **Step 3: Implement the Groq adapter and `RawClassification` parsing.**
- [ ] **Step 4: Run tests; verify PASS.**
- [ ] **Step 5: Commit `feat: add configurable LLM harness`.**

### Task 2: Implement prompt construction and result policy

**Files:**
- Create: `ai/src/service/classification.py`, `ai/tests/service/test_classification.py`

**Interfaces:**
- Consumes: `RetrievalResult`, `LLMClient.classify`.
- Produces: `classify(retrieval: RetrievalResult, excerpt: str) -> ClassificationResult`.

**Acceptance Criteria:** prompt contains only document excerpt and retrieved candidates; result limits, retrieved-ID validation, duplicate removal, and `0.80/0.60` policy are server-enforced.

- [ ] **Step 1: Write failing tests for all policy thresholds and unknown/duplicate IDs.**
- [ ] **Step 2: Run `uv run pytest tests/service/test_classification.py -v`; verify failure.**
- [ ] **Step 3: Implement `classify` and prompt builder.**
- [ ] **Step 4: Run tests; verify PASS.**
- [ ] **Step 5: Commit `feat: classify retrieved catalogue candidates`.**
