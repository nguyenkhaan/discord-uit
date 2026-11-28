# Document AI worker

The AI service consumes `document.classification.requested.v1`, downloads the private document with the short-lived signed URL in that event, and publishes a validated completion or failure event. The HTTP app only exposes `/health/live` and `/health/ready`; it has no browser-facing classification endpoint.

Task 3 provides the Kafka runtime, PostgreSQL idempotency state, event validation, bounded retries and health checks. Task 4 provides bounded TXT/DOCX/PPTX/PDF extraction and conditional OCR. The agent recommendation stage is added in Task 5.

## Configuration

Copy `.env.example` to `.env`. Set `DATABASE_URL` to a local PostgreSQL database where the `classification_job` migration has been applied. For local Docker Kafka use `localhost:9092`; when the worker runs inside the Compose network use `kafka:29092`.

`DOCUMENT_URL_ALLOWED_HOSTS` is a comma-separated allowlist of exact `host:port` values from backend signed URLs. Add the storage endpoint used by the backend. The worker rejects other hosts and redirects. Do not put storage credentials or permanent object keys in this service's configuration.

Scanned PDFs use RapidOCR PP-OCRv6 small with ONNX Runtime and Vietnamese recognition. RapidOCR and its CPU runtime are installed through this project's `uv` dependencies; no system OCR binary or third-party OCR API is used. RapidOCR downloads model weights on first use and caches them under its package model directory, so that directory must be writable and the first OCR run needs network access. Provision the models in advance for offline deployments. OCR runs locally in a killable child process, and PDF page images stay on this machine. `OCR_CPU_THREADS` limits ONNX Runtime CPU threads (default: 2). The first page may take longer while the model initializes.

## Run and check

```bash
uv sync
uv run pytest tests -q
uv run python main.py
```

The worker must be reachable only from its private service network. Local development binds to `127.0.0.1`. A container can set `HOST=0.0.0.0` for private-network access, but must not publish the health port to a public host interface.

```bash
curl -fsS http://127.0.0.1:5050/health/live
curl -fsS http://127.0.0.1:5050/health/ready
```

Readiness becomes healthy after the worker has connected to PostgreSQL and Kafka and its consumer task is running. Logs include Kafka location and error type only; they must not include event payloads, signed URLs, extracted text, or document content.

## Local Kafka verification

From the repository root, start only the local broker and private object store:

```bash
docker compose up -d kafka kafka-init minio
docker compose ps -a
curl -fsS http://127.0.0.1:9000/minio/health/ready
```

The `kafka-init` one-shot container should exit with code 0 after creating the notification and classification topics. The opt-in worker integration test creates isolated temporary topics, sends a duplicate request, exercises the real extraction workflow against a mocked private download and classifier, and checks expired signed URL and malformed-event handling. It uses an in-memory job store, so it does not exercise PostgreSQL persistence:

```bash
CLASSIFICATION_KAFKA_INTEGRATION=true \
CLASSIFICATION_KAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
uv run pytest tests/test_kafka_integration.py -q
```

The backend broker test uses isolated topics and a mocked result service. Run it from `app/backend`:

```bash
CLASSIFICATION_KAFKA_INTEGRATION=true \
CLASSIFICATION_KAFKA_BOOTSTRAP_SERVERS=localhost:9092 \
./gradlew test --tests '*ClassificationKafkaIntegrationTests'
```

These broker tests do not replace the full upload → database outbox → worker → database result flow. Run that flow only against a disposable local PostgreSQL database with the project migrations applied; do not point it at a shared or production database. The repository's ignored `application.properties` is machine-local configuration and is intentionally not part of the runbook or commit.

## Security checks before deployment

- Bind Kafka's host listener to localhost or a private network, and restrict topic ACLs so the backend can publish requests/read results while the worker can read requests/publish results and dead letters.
- Keep MinIO buckets private and grant the worker no storage credentials; pass only short-lived signed GET URLs scoped to one object.
- Keep the AI port off public interfaces. It exposes only liveness/readiness and has no endpoint that accepts classification requests.
- Keep OCR text, signed URLs, access tokens, storage credentials and document contents out of logs and dead-letter payloads.
- Treat AI output as a suggestion. Only the backend validates the run and taxonomy; only the admin review flow can approve or publish a document.

## Manual content checks

To test local PDF extraction without sending it to Kafka, run this from `app/ai` and pass a PDF path:

```bash
uv run python -m scripts.manual_extract /path/to/sample.pdf
```

Expected behavior: text-layer PDFs report `source=pdf_text` and skip OCR; scanned PDFs report `source=ocr` (or `mixed`) and use RapidOCR PP-OCRv6 small. The manual script prints all extracted text. TXT, DOCX and PPTX extraction are covered by the AI tests. Extracted text is sensitive; avoid pasting it into logs or tickets.
