# Document Classifier — Phase 01: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a runnable, testable FastAPI skeleton at `ai` using Python 3.12 and uv.

**Architecture:** `main.py` is an intentionally thin Uvicorn entry point. `src/app.py` owns FastAPI creation and route registration; configuration is loaded once from `.env`.

**Tech Stack:** Python 3.12, uv, FastAPI, Uvicorn, Pydantic Settings, pytest, httpx.

**Spec:** `docs/superpowers/specs/2026-11-15-document-classifier-design.md`

## Global Constraints

- Product code lives in `/home/cloud/workspace/project/webapp/se347-project/ai`.
- Run locally with `uv run main.py`; `PORT` comes from `.env` and defaults to `5050`.
- `main.py` contains no application logic beyond invoking Uvicorn.
- Use the required `src/config`, `src/harness`, `src/service`, `src/route`, and `src/dto-contract` directories.
- Secrets are read from environment variables and never committed.

## Review Focus

- Missing `.env` uses port `5050`; test in Task 1.
- Invalid `PORT` fails with a useful configuration error; test in Task 1.
- The app factory can be imported without provider credentials; test in Task 2.

---

### Task 1: Create the uv project and configuration contract

**Files:**
- Create: `ai/pyproject.toml`, `ai/.python-version`, `ai/.env.example`, `ai/src/config/settings.py`, `ai/tests/config/test_settings.py`

**Interfaces:**
- Produces: `Settings.port: int`, `get_settings() -> Settings`.

**Acceptance Criteria:** Python 3.12 is required; absent `.env` yields port `5050`; `.env.example` documents `PORT`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `LLM_MODEL`, upload limit, and cache path.

- [ ] **Step 1: Write `test_default_port_is_5050` and `test_invalid_port_is_rejected`.**
- [ ] **Step 2: Run `uv run pytest tests/config/test_settings.py -v`; verify failure.**
- [ ] **Step 3: Implement `class Settings(BaseSettings)` and `get_settings() -> Settings` in `src/config/settings.py`.** Use `env_file=".env"` and default `port=5050`.
- [ ] **Step 4: Add the Python 3.12 uv dependencies and `.env.example`.**
- [ ] **Step 5: Run the tests; verify PASS.**
- [ ] **Step 6: Commit `chore: scaffold uv configuration`.**

### Task 2: Build the importable FastAPI application and health route

**Files:**
- Create: `ai/main.py`, `ai/src/app.py`, `ai/src/route/health.py`, `ai/tests/route/test_health.py`, package `__init__.py` files

**Interfaces:**
- Consumes: `get_settings() -> Settings`.
- Produces: `create_app() -> FastAPI`; `GET /health` returns `{"status": "ok"}`.

**Acceptance Criteria:** `uv run main.py` binds Uvicorn to `PORT`; importing `create_app` does not require Gemini/LLM credentials.

- [ ] **Step 1: Write `test_health_returns_ok` using `TestClient(create_app())`.**
- [ ] **Step 2: Run `uv run pytest tests/route/test_health.py -v`; verify failure.**
- [ ] **Step 3: Implement `create_app() -> FastAPI` and `health_router`.**
- [ ] **Step 4: Implement `main.py` as `uvicorn.run("src.app:create_app", factory=True, host="127.0.0.1", port=get_settings().port)`.**
- [ ] **Step 5: Run tests and `uv run main.py`; verify `/health` returns 200.**
- [ ] **Step 6: Commit `feat: add FastAPI application foundation`.**
