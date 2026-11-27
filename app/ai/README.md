# Document AI worker

The AI service consumes `document.classification.requested.v1`, downloads the private document with the short-lived signed URL in that event, and publishes a validated completion or failure event. The HTTP app only exposes `/health/live` and `/health/ready`; it has no browser-facing classification endpoint.

Task 3 provides the Kafka runtime, PostgreSQL idempotency state, event validation, bounded retries and health checks. Task 4 provides bounded TXT/DOCX/PPTX/PDF extraction and conditional OCR. The agent recommendation stage is added in Task 5.

## Configuration

Copy `.env.example` to `.env`. Set `DATABASE_URL` to the PostgreSQL database where the `classification_job` migration has been applied. For local Docker Kafka use `localhost:9092`; when the worker runs inside the Compose network use `kafka:29092`.

`DOCUMENT_URL_ALLOWED_HOSTS` is a comma-separated allowlist of exact `host:port` values from backend signed URLs. Add the storage endpoint used by the backend. The worker rejects other hosts and redirects. Do not put storage credentials or permanent object keys in this service's configuration.

Scanned PDFs use RapidOCR PP-OCRv6 small with ONNX Runtime and Vietnamese recognition. RapidOCR and its CPU runtime are installed through this project's `uv` dependencies; no system OCR binary or third-party OCR API is used. RapidOCR downloads model weights on first use and caches them under its package model directory, so that directory must be writable and the first OCR run needs network access. Provision the models in advance for offline deployments. OCR runs locally in a killable child process, and PDF page images stay on this machine. `OCR_CPU_THREADS` limits ONNX Runtime CPU threads (default: 2). The first page may take longer while the model initializes.

## Run and check

```bash
uv sync
uv run pytest tests -q
uv run python main.py
```

The worker must be reachable only from its private service network. In a container, bind the health app to the container interface and do not publish its port to the public host. Local development can bind to `127.0.0.1`.

```bash
curl -fsS http://127.0.0.1:5050/health/live
curl -fsS http://127.0.0.1:5050/health/ready
```

Readiness becomes healthy after the worker has connected to PostgreSQL and Kafka and its consumer task is running. Logs include Kafka location and error type only; they must not include event payloads, signed URLs, extracted text, or document content.

## Manual content checks

To test local PDF extraction without sending it to Kafka, run this from `app/ai` and pass a PDF path:

```bash
uv run python -m scripts.manual_extract /path/to/sample.pdf
```

Expected behavior: text-layer PDFs report `source=pdf_text` and skip OCR; scanned PDFs report `source=ocr` (or `mixed`) and use RapidOCR PP-OCRv6 small. The manual script prints all extracted text. TXT, DOCX and PPTX extraction are covered by the AI tests. Extracted text is sensitive; avoid pasting it into logs or tickets.
