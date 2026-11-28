import asyncio
import os
from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import uuid4

import httpx
import pytest
from aiokafka import AIOKafkaConsumer, AIOKafkaProducer
from aiokafka.admin import AIOKafkaAdminClient, NewTopic
from aiokafka.errors import TopicAlreadyExistsError

from src.agentic.output_schema import ClassificationRecommendations
from src.agentic.workflow import process_classification_request
from src.config.setting import Settings
from src.contract.classification_event import (
    ClassificationCompletedEvent,
    ClassificationFailedEvent,
    ClassificationRequestedEvent,
    Suggestion,
)
from src.worker.job_store import Claim
from src.worker.kafka_consumer import KafkaConsumer
from src.worker.kafka_producer import KafkaProducer
from src.worker.runtime import ClassificationWorker


def test_ai_app_exposes_only_internal_health_routes() -> None:
    asyncio.run(_check_ai_http_boundary())


async def _check_ai_http_boundary() -> None:
    from src.app import app

    app.state.worker = SimpleNamespace(is_ready=True)
    async with httpx.AsyncClient(
        transport=httpx.ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        assert (await client.get("/health/live")).status_code == 200
        assert (await client.get("/health/ready")).status_code == 200
        assert (await client.get("/docs")).status_code == 404
        assert (await client.get("/openapi.json")).status_code == 404
        assert (await client.post("/classify")).status_code == 404


class InMemoryJobStore:
    def __init__(self) -> None:
        self._published: set[str] = set()
        self.saved_results: dict[str, tuple[str, str]] = {}
        self.claims: dict[str, int] = {}

    async def claim(self, run_id: str, attempt: int) -> Claim:
        self.claims[run_id] = self.claims.get(run_id, 0) + 1
        if run_id in self._published:
            return Claim(should_process=False)
        lease_until = datetime.now(timezone.utc) + timedelta(minutes=1)
        return Claim(should_process=True, attempt=attempt, lease_until=lease_until)

    async def save_result(
        self,
        run_id: str,
        topic: str,
        payload: str,
        lease_token: datetime,
    ) -> bool:
        self.saved_results[run_id] = (topic, payload)
        return True

    async def renew_lease(self, run_id: str, lease_token: datetime) -> datetime:
        return lease_token + timedelta(minutes=1)

    async def mark_published(self, run_id: str) -> None:
        self._published.add(run_id)


class FakeClassifier:
    async def recommend(
        self,
        *,
        document_text: str,
        collection_slugs: list[str],
        tag_slugs: list[str],
    ) -> ClassificationRecommendations:
        return ClassificationRecommendations(
            collection_suggestions=[Suggestion(slug="research", confidence=0.91)],
            tag_suggestions=[Suggestion(slug="research", confidence=0.84)],
        )


def _request(run_id: str, *, expires_at: datetime) -> ClassificationRequestedEvent:
    return ClassificationRequestedEvent.model_validate(
        {
            "schemaVersion": "v1",
            "eventId": str(uuid4()),
            "classificationRunId": run_id,
            "documentId": str(uuid4()),
            "submissionId": str(uuid4()),
            "mediaId": str(uuid4()),
            "file": {
                "fileName": "notes.txt",
                "mimeType": "text/plain",
                "sizeBytes": len(b"Private integration sample."),
                "verifiedEtag": "integration-etag",
            },
            "signedGetUrl": {
                "value": "http://localhost:9000/private/notes.txt?token=integration-secret",
                "expiresAt": expires_at.isoformat(),
            },
            "taxonomy": {
                "version": "integration-v1",
                "collectionSlugs": ["research"],
                "tagSlugs": ["research"],
            },
            "attempt": 1,
            "occurredAt": datetime.now(timezone.utc).isoformat(),
        }
    )


async def _wait_for_assignment(consumer: AIOKafkaConsumer) -> None:
    for _ in range(100):
        if consumer.assignment():
            return
        await asyncio.sleep(0.05)
    raise AssertionError("Kafka consumer was not assigned a test partition.")


async def _delete_test_topics(bootstrap_servers: str, topics: list[str]) -> None:
    admin = AIOKafkaAdminClient(bootstrap_servers=bootstrap_servers)
    await admin.start()
    try:
        await admin.delete_topics(topics, timeout_ms=10_000)
    finally:
        await admin.close()


@pytest.mark.skipif(
    os.getenv("CLASSIFICATION_KAFKA_INTEGRATION", "").lower() != "true",
    reason="set CLASSIFICATION_KAFKA_INTEGRATION=true to use local Kafka",
)
def test_worker_consumes_kafka_requests_once_and_publishes_sanitized_results() -> None:
    asyncio.run(_run_worker_kafka_integration())


async def _run_worker_kafka_integration() -> None:
    bootstrap_servers = os.getenv("CLASSIFICATION_KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    suffix = uuid4().hex
    request_topic = f"classification-it-request-{suffix}"
    completed_topic = f"classification-it-completed-{suffix}"
    failed_topic = f"classification-it-failed-{suffix}"
    dlq_topic = f"classification-it-dlq-{suffix}"
    admin = AIOKafkaAdminClient(bootstrap_servers=bootstrap_servers)
    await admin.start()
    try:
        try:
            await admin.create_topics(
                [
                    NewTopic(topic, num_partitions=1, replication_factor=1)
                    for topic in (request_topic, completed_topic, failed_topic, dlq_topic)
                ]
            )
        except TopicAlreadyExistsError:
            pass
    finally:
        await admin.close()

    settings = Settings(
        _env_file=None,
        database_url="postgresql+asyncpg://local:local@127.0.0.1:5432/unused",
        kafka_bootstrap_servers=bootstrap_servers,
        kafka_group_id=f"classification-it-worker-{suffix}",
        kafka_requested_topic=request_topic,
        kafka_completed_topic=completed_topic,
        kafka_failed_topic=failed_topic,
        kafka_dlq_topic=dlq_topic,
        service_id=f"classification-it-{suffix}",
        document_url_allowed_hosts="localhost:9000",
        worker_retry_backoff_ms=10,
        job_lease_seconds=30,
    )
    http_client = httpx.AsyncClient(
        transport=httpx.MockTransport(
            lambda request: httpx.Response(
                200,
                content=b"Private integration sample.",
                headers={"etag": "integration-etag"},
            )
        ),
        trust_env=False,
    )
    processed_runs: list[str] = []

    async def processor(request: ClassificationRequestedEvent) -> tuple[str, str]:
        processed_runs.append(request.classification_run_id)
        return await process_classification_request(
            request,
            settings,
            http_client=http_client,
            llm_client=FakeClassifier(),
        )

    worker = ClassificationWorker(settings=settings, processor=processor)
    job_store = InMemoryJobStore()
    worker._job_store = job_store  # type: ignore[assignment]
    worker_output_producer = AIOKafkaProducer(
        bootstrap_servers=bootstrap_servers,
        client_id=f"classification-it-output-{suffix}",
        acks="all",
        enable_idempotence=True,
    )
    request_producer = AIOKafkaProducer(bootstrap_servers=bootstrap_servers)
    request_consumer = KafkaConsumer(settings)
    completed_consumer = AIOKafkaConsumer(
        completed_topic,
        bootstrap_servers=bootstrap_servers,
        group_id=f"classification-it-completed-{suffix}",
        auto_offset_reset="earliest",
        enable_auto_commit=False,
    )
    failed_consumer = AIOKafkaConsumer(
        failed_topic,
        bootstrap_servers=bootstrap_servers,
        group_id=f"classification-it-failed-{suffix}",
        auto_offset_reset="earliest",
        enable_auto_commit=False,
    )
    dlq_consumer = AIOKafkaConsumer(
        dlq_topic,
        bootstrap_servers=bootstrap_servers,
        group_id=f"classification-it-dlq-{suffix}",
        auto_offset_reset="earliest",
        enable_auto_commit=False,
    )

    try:
        await worker_output_producer.start()
        await request_producer.start()
        await request_consumer.start()
        await completed_consumer.start()
        await failed_consumer.start()
        await dlq_consumer.start()
        await _wait_for_assignment(request_consumer._consumer)  # type: ignore[arg-type]
        await _wait_for_assignment(completed_consumer)
        await _wait_for_assignment(failed_consumer)
        await _wait_for_assignment(dlq_consumer)
        worker._consumer = request_consumer  # type: ignore[assignment]
        worker._producer = KafkaProducer(worker_output_producer)

        future_expiry = datetime.now(timezone.utc) + timedelta(minutes=5)
        valid_request = _request(f"run_{suffix}", expires_at=future_expiry)
        expired_request = _request(
            f"expired_{suffix}",
            expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
        )
        valid_payload = valid_request.model_dump_json(by_alias=True).encode()
        await request_producer.send_and_wait(request_topic, key=b"duplicate", value=valid_payload)
        await request_producer.send_and_wait(request_topic, key=b"duplicate", value=valid_payload)
        await request_producer.send_and_wait(
            request_topic,
            key=b"expired",
            value=expired_request.model_dump_json(by_alias=True).encode(),
        )
        await request_producer.send_and_wait(
            request_topic,
            key=b"malformed",
            value=b'{"signedGetUrl":"http://localhost:9000/?token=integration-secret"',
        )

        for _ in range(4):
            record = await asyncio.wait_for(request_consumer.getone(), timeout=10)
            await worker._handle_record(record)

        completed_records = [
            record
            for batch in (await completed_consumer.getmany(timeout_ms=1000)).values()
            for record in batch
        ]
        failed_records = [
            record
            for batch in (await failed_consumer.getmany(timeout_ms=1000)).values()
            for record in batch
        ]
        dlq_records = [
            record
            for batch in (await dlq_consumer.getmany(timeout_ms=1000)).values()
            for record in batch
        ]

        assert len(completed_records) == 1
        completed = ClassificationCompletedEvent.model_validate_json(completed_records[0].value)
        assert completed.classification_run_id == valid_request.classification_run_id
        assert completed.ocr_text == "Private integration sample."
        assert completed.collection_suggestions[0].slug == "research"
        assert len(failed_records) == 1
        failed = ClassificationFailedEvent.model_validate_json(failed_records[0].value)
        assert failed.failure_code == "SIGNED_URL_EXPIRED"
        assert "integration-secret" not in failed_records[0].value.decode()
        assert len(dlq_records) == 1
        assert "integration-secret" not in dlq_records[0].value.decode()
        assert processed_runs.count(valid_request.classification_run_id) == 1
        assert processed_runs.count(expired_request.classification_run_id) == 1
        assert job_store.claims[valid_request.classification_run_id] == 2
    finally:
        await request_consumer.stop()
        await completed_consumer.stop()
        await failed_consumer.stop()
        await dlq_consumer.stop()
        await request_producer.stop()
        await worker_output_producer.stop()
        await http_client.aclose()
        await _delete_test_topics(
            bootstrap_servers,
            [request_topic, completed_topic, failed_topic, dlq_topic],
        )
