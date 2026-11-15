# Atlas document classifier

Atlas is a local FastAPI MVP that suggests existing tags and collections for an uploaded document. It combines Gemini Embedding 2 retrieval with a Groq-hosted LLM classification step.

## Run locally

Use Python 3.12 and [uv](https://docs.astral.sh/uv/).

```bash
cp .env.example .env
uv sync
uv run main.py
```

Open [http://127.0.0.1:5050](http://127.0.0.1:5050). Set `PORT` in `.env` to use a different local port.

Required provider variables in `.env`:

- `GEMINI_API_KEY`: used by Gemini Embedding 2 to embed catalogue entries and text extracted from uploaded documents.
- `GROQ_API_KEY`: used by the final classifier through Groq.
- `LLM_MODEL`: the Groq model identifier; it defaults to `openai/gpt-oss-20b`.

`GEMINI_EMBEDDING_MODEL`, `CACHE_PATH`, and `MAX_UPLOAD_BYTES` have useful defaults in `.env.example`.

## Use the app

Upload one `.txt`, `.md`, `.pdf`, or `.docx` file. The result contains at most three tags and two collections, each with a classifier confidence estimate and short reason. When no current catalogue entry is suitable, the app can show a separate suggestion for one new tag or collection; it does not write that suggestion back to `data/data.json`.

For a PDF, Atlas first reads its embedded text layer. If it is image-only or scanned, the application falls back to local, CPU-only PaddleOCR. The first scanned PDF may take longer because PaddleOCR downloads its local model files to `~/.paddlex/official_models/`. OCR handles at most `MAX_OCR_PAGES` pages (default `10`) rendered at `OCR_RENDER_DPI` (default `200`), with `OCR_CPU_THREADS=2` and a `MAX_OCR_PIXELS_PER_PAGE` safety cap. Every PDF is also capped at `MAX_PDF_PAGES` (default `100`). No rendered images or OCR text are saved by the app.

## Data and privacy

`data/data.json` is the authoritative catalogue. `cache/catalogue_embeddings.json` is a derived local cache of catalogue vectors: it speeds restarts and is safe to rebuild with:

```bash
uv run python scripts/rebuild_embeddings.py --force
```

The application keeps the active catalogue index and current request only in memory. It does not persist uploads, extracted text, or classification results. However, extracted document text is sent to Gemini for embedding, and an excerpt plus retrieved catalogue entries are sent to Groq for final classification. Review the providers' policies before uploading sensitive documents.

## Check the project

```bash
uv run pytest -v
```
