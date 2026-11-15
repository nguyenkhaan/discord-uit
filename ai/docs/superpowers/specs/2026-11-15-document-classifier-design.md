# MVP document tag and collection classifier

## Intent

Build a local FastAPI web application for one person to upload a document and
receive AI-generated suggestions for tags and collections. The MVP validates
whether a retrieval-augmented LLM workflow can classify English and Vietnamese
documents against a mixed-language catalogue.

The application is a new, independent project. Product code will live in
`/home/cloud/workspace/project/webapp/se347-project/ai`.

## Goals

- Accept `.txt`, `.md`, `.pdf`, and `.docx` uploads.
- Extract document text and return at most three tag suggestions and two
  collection suggestions.
- Display a confidence value and one short reason for each result.
- Use Gemini Embedding 2 to retrieve relevant existing catalogue entries before
  asking an LLM to make the final classification.
- Propose a new tag or collection only when it is strongly justified:
  confidence at least `0.80`, and no existing entry is adequately suitable.
- Load the initial tag and collection catalogue from `data.json`.
- Keep uploads and analysis results in memory only.
- Cache *catalogue embeddings* locally, so unchanged tags and collections are
  not embedded again after an application restart.

## Non-goals

- Authentication, multi-user accounts, authorization, sharing, or history.
- Editing or approving suggestions, writing new tags/collections back to
  `data.json`, or persisting upload results.
- OCR for scanned/image-only PDFs.
- A vector database, background jobs, deployment configuration, or Docker.
- Guaranteed zero-cost operation: the LLM provider must offer the chosen model
  under a usable free quota, which can change independently of this project.

## Constraints and supplied data

- The app runs locally.
- Documents may be English or Vietnamese. Tags are English; collection names
  and descriptions may mix English and Vietnamese within one catalogue.
- The catalogue source is `data.json` with this shape:

  ```json
  {
    "tags": [{"id": "...", "name": "...", "slug": "...", "description": "..."}],
    "collections": [{"id": "...", "name": "...", "slug": "...", "description": "...", "keywords": ["..."]}]
  }
  ```

- Gemini Embedding 2 is the embedding provider. A `GEMINI_API_KEY` is supplied
  through the environment and is never committed.
- The final-classification LLM is accessed through a Groq harness. Its model is
  configurable through environment variables rather than hard-coded because
  free-model availability changes often.

## Approaches considered

1. **LLM receives the entire catalogue directly.** It is simple, but context
   and token costs grow with the catalogue and quality becomes less predictable.
2. **Embedding retrieval followed by LLM classification (chosen).** Embed the
   catalogue entries, retrieve the closest candidates for an upload, then pass
   only those candidates to the LLM. This preserves semantic matching across
   Vietnamese and English while keeping the LLM prompt bounded.
3. **Embedding-only classification.** It is cheap and deterministic but gives
   weaker explanations and unreliable new-entry proposals.

The user chose approach 2. Gemini Embedding 2 provides semantic retrieval;
the LLM remains responsible for constrained final choices and explanations.

## User experience

1. The user opens a single-page local web UI.
2. They select one allowed document and submit it.
3. The page shows a processing state and then an analysis result:
   - up to three existing tag cards;
   - up to two existing collection cards;
   - optional, visually separate “suggested new tag” and/or “suggested new
     collection” cards;
   - every card includes name, slug when applicable, confidence, and a
     one-sentence reason.
4. A validation or extraction error is shown on the same page in plain language.

The UI is server-rendered with FastAPI templates and minimal static CSS/JS;
there is no client-side application framework.

## Architecture

### Application layers

- **Web layer:** FastAPI routes for the upload form and analysis response;
  Jinja templates render both initial and result/error states.
- **Extraction layer:** validates extension and size, extracts Unicode text from
  TXT/Markdown, PDF, and DOCX. Empty or image-only PDF content is rejected with
  an OCR-not-supported message. Uploaded bytes are discarded after the request.
- **Catalogue layer:** validates `data.json` with Pydantic models and produces
  canonical searchable text for each entry:
  - tag: name + slug + description;
  - collection: name + slug + description + keywords.
- **Embedding layer:** wraps Gemini Embedding 2 and cosine similarity. It is
  separate from the LLM harness so providers can change independently.
- **Catalogue cache:** stores only vectors and cache metadata for catalogue
  entries on local disk. Cache metadata includes the embedding-model identifier
  and a SHA-256 hash of each entry’s canonical searchable text. On startup,
  unchanged cached vectors are loaded, changed/new entries are embedded, and
  removed entries are discarded. The complete in-use index lives in RAM.
- **Retrieval layer:** embeds the upload text, ranks existing tag and collection
  entries independently by cosine similarity, and forwards a bounded top set
  (implementation default: 8 tags and 5 collections) to the classifier.
- **LLM harness:** calls the configured Groq chat-completions API, requests
  strict JSON validated by Pydantic, and exposes normalized errors.
- **Classification layer:** composes a prompt with the extracted text and
  retrieved candidates; validates that the LLM selects only supplied existing
  IDs; enforces output limits and the new-entry confidence rule.

### Required project layout

The implementation will use Python 3.12 and `uv`. It will be initialized in
`/home/cloud/workspace/project/webapp/se347-project/ai` with this shape:

```text
main.py                 # uvicorn launch command only; run with `uv run main.py`
src/
  app.py                # creates FastAPI and registers routes
  config/
  harness/
  service/
  route/
  dto-contract/
data/
  data.json             # authoritative tag/collection catalogue
  contract.py           # DTOs for the tag and collection records
cache/                  # persistent catalogue embedding cache and recyclable artifacts
.env.example
```

`PORT` is loaded from `.env`; the default local port is `5050`. `main.py` is
the sole command-line entry point and does not contain application logic.

### Long documents

The MVP extracts text and limits the text sent to external models to a bounded
number of chunks. It embeds the document chunks and uses the strongest
similarity per catalogue entry for retrieval. The classifier receives a compact
excerpt plus the retrieved candidates, not the full file. Exact chunk size and
maximum chunks are implementation choices, selected to remain within Gemini and
LLM input limits. The result page will note if analysis was limited by length.

### Classification contract

The LLM returns structured JSON with separate lists for `tags`, `collections`,
`new_tags`, and `new_collections`. Existing entries contain an ID, normalized
confidence in `[0, 1]`, and a short reason. New entries additionally contain a
name and slug proposal.

Server-side rules:

- Existing output lists are capped at 3 tags and 2 collections.
- Duplicate IDs and entries outside retrieved candidates are rejected.
- New entries are shown only if their declared confidence is at least `0.80`
  and the best suitable existing alternative is below the implementation’s
  “adequately suitable” threshold (default `0.60`).
- If the LLM response fails validation, make one bounded repair request; if it
  still fails, return a safe error rather than a fabricated classification.

Similarity scores are retrieval signals, not displayed as semantic confidence.
Displayed confidence is the classifier’s calibrated judgment and should be
labelled as an estimate in the UI.

## Storage and privacy

- `data.json` is the authoritative on-disk catalogue.
- The catalogue-embedding cache is a derived local artifact, stored beneath the
  application’s `.cache/` directory and excluded from version control.
- In-memory state contains the active catalogue index and only the current
  request’s extracted text, document vector, candidates, and result.
- Uploads, raw document text, and results are not retained after the response.
- Gemini receives text used for embedding; the configured LLM provider receives
  document excerpts and retrieved catalogue context. The UI/documentation will
  state this explicitly.

## Configuration and failure behaviour

`.env.example` will document: `GEMINI_API_KEY`, `GROQ_API_KEY`, `LLM_MODEL`,
upload size limit, and cache path. The app
checks essential configuration at startup and presents clear configuration,
provider, extraction, validation, and oversized-file errors.

The local cache is an optimization, never an authority: cache corruption or a
model/configuration change triggers a rebuild rather than affecting results.

## Success criteria

- A local user can upload each supported text-bearing file type and see a
  rendered result or an accurate error.
- The app retrieves catalogue candidates with Gemini Embedding 2 and uses the
  configured LLM harness for final structured classification.
- Repeated uploads do not re-embed unchanged tags and collections.
- Restarting the app reuses the valid local catalogue-embedding cache.
- No upload or analysis result is persisted after its request completes.

## Builder decisions still allowed

- Exact template style, file/module names, chunk sizes, upload byte limit, and
  the cache file encoding.
- The concrete free LLM model selected through the provider configuration.
- Test fixtures, exact HTTP status codes, and retry/backoff timing.
