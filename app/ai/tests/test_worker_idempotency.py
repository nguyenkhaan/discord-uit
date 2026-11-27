import asyncio
import json
import unittest
from dataclasses import replace
from datetime import datetime, timedelta, timezone
from typing import Any
from unittest.mock import AsyncMock, patch

from aiokafka.structs import ConsumerRecord

from src.config.setting import Settings
from src.contract.classification_event import (
    ClassificationFailedEvent,
    ClassificationRequestedEvent,
)
from src.worker.job_store import Claim
from src.worker.job_store import JobStore
from src.worker.runtime import ClassificationWorker, LeaseOwnershipLost


def make_request() -> ClassificationRequestedEvent:
    return ClassificationRequestedEvent.model_validate(
        {
            "schemaVersion": "v1",
            "eventId": "00000000-0000-0000-0000-000000000001",
            "classificationRunId": "run_1",
            "documentId": "00000000-0000-0000-0000-000000000002",
            "submissionId": "00000000-0000-0000-0000-000000000003",
            "mediaId": "00000000-0000-0000-0000-000000000004",
            "file": {
                "fileName": "notes.txt",
                "mimeType": "text/plain",
                "sizeBytes": 5,
                "verifiedEtag": "etag-1",
            },
            "signedGetUrl": {
                "value": "http://localhost:9000/private/notes.txt?token=secret",
                "expiresAt": "2099-11-27T12:00:00Z",
            },
            "taxonomy": {
                "version": "v1",
                "collectionSlugs": [],
                "tagSlugs": [],
            },
            "attempt": 1,
            "occurredAt": "2026-11-27T11:00:00Z",
        }
    )


def make_record(payload: bytes) -> ConsumerRecord[bytes, bytes]:
    return ConsumerRecord(
        topic="document.classification.requested.v1",
        partition=0,
        offset=5,
        timestamp=0,
        timestamp_type=0,
        key=None,
        value=payload,
        checksum=None,
        serialized_key_size=-1,
        serialized_value_size=len(payload),
        headers=[],
    )


class FakeJobStore:
    def __init__(self, claims: list[Claim]) -> None:
        self.claims = claims
        self.claim_calls = 0
        self.saved: tuple[str, str, str] | None = None
        self.published: list[str] = []
        self.save_succeeds = True
        self.renew_succeeds = True

    async def claim(self, run_id: str, attempt: int) -> Claim:
        self.claim_calls += 1
        claim = self.claims.pop(0)
        if claim.attempt is None or (claim.should_process and claim.lease_until is None):
            claim = replace(
                claim,
                attempt=claim.attempt if claim.attempt is not None else attempt,
                lease_until=(
                    claim.lease_until
                    or datetime.now(timezone.utc) + timedelta(minutes=5)
                    if claim.should_process
                    else None
                ),
            )
        return claim

    async def save_result(
        self,
        run_id: str,
        topic: str,
        payload: str,
        lease_token: datetime,
    ) -> bool:
        if self.save_succeeds:
            self.saved = (run_id, topic, payload)
        return self.save_succeeds

    async def renew_lease(self, run_id: str, lease_token: datetime) -> datetime | None:
        if not self.renew_succeeds:
            return None
        return lease_token + timedelta(minutes=5)

    async def mark_published(self, run_id: str) -> None:
        self.published.append(run_id)


class FakeProducer:
    def __init__(self) -> None:
        self.messages: list[tuple[str, str, str]] = []

    async def publish(self, topic: str, key: str, payload: str) -> None:
        self.messages.append((topic, key, payload))


class FakeConsumer:
    def __init__(self) -> None:
        self.commits: list[tuple[str, int, int]] = []

    async def commit(self, topic: str, partition: int, offset: int) -> None:
        self.commits.append((topic, partition, offset))


class WorkerIdempotencyTests(unittest.IsolatedAsyncioTestCase):
    def make_worker(self, claim: Claim | list[Claim]) -> tuple[ClassificationWorker, FakeJobStore, FakeProducer, FakeConsumer]:
        claims = claim if isinstance(claim, list) else [claim]
        worker = ClassificationWorker(
            settings=Settings(
                _env_file=None,
                database_url="postgresql+asyncpg://worker:worker@127.0.0.1:5432/worker",
                worker_retry_backoff_ms=10,
            )
        )
        store = FakeJobStore(claims)
        producer = FakeProducer()
        consumer = FakeConsumer()
        worker._job_store = store  # type: ignore[assignment]
        worker._producer = producer  # type: ignore[assignment]
        worker._consumer = consumer  # type: ignore[assignment]
        return worker, store, producer, consumer

    async def test_published_duplicate_is_acked_without_running_processor(self) -> None:
        worker, _, _, consumer = self.make_worker(Claim(should_process=False))
        worker._processor = AsyncMock()

        await worker._handle_record(make_record(make_request().model_dump_json(by_alias=True).encode()))

        worker._processor.assert_not_awaited()
        self.assertEqual(consumer.commits, [("document.classification.requested.v1", 0, 6)])

    async def test_active_duplicate_waits_for_the_existing_claim_before_ack(self) -> None:
        worker, store, _, consumer = self.make_worker(
            [Claim(should_process=False, wait_seconds=0.01), Claim(should_process=False)]
        )

        await worker._handle_record(make_record(make_request().model_dump_json(by_alias=True).encode()))

        self.assertEqual(store.claim_calls, 2)
        self.assertEqual(consumer.commits[0][2], 6)

    async def test_invalid_processor_output_is_replaced_with_valid_failure_event(self) -> None:
        worker, store, producer, consumer = self.make_worker(Claim(should_process=True))
        worker._processor = AsyncMock(
            return_value=("document.classification.completed.v1", "not-json")
        )

        await worker._handle_record(make_record(make_request().model_dump_json(by_alias=True).encode()))

        self.assertEqual(store.saved[1], "document.classification.failed.v1")
        output = ClassificationFailedEvent.model_validate_json(store.saved[2])
        self.assertEqual(output.failure_code, "INVALID_WORKER_OUTPUT")
        self.assertEqual(producer.messages[0][0], "document.classification.failed.v1")
        self.assertEqual(consumer.commits[0][2], 6)

    async def test_malformed_input_goes_to_dlq_without_copying_signed_url(self) -> None:
        worker, _, producer, consumer = self.make_worker(Claim(should_process=False))
        malformed = b'{"signedGetUrl":"token=top-secret"'

        await worker._handle_record(make_record(malformed))

        self.assertEqual(producer.messages[0][0], "document.classification.dlq.v1")
        self.assertNotIn("top-secret", producer.messages[0][2])
        self.assertEqual(consumer.commits[0][2], 6)

    async def test_result_pending_jsonb_payload_is_republished_without_reprocessing(self) -> None:
        request = make_request()
        failed = ClassificationFailedEvent(
            classification_run_id=request.classification_run_id,
            document_id=request.document_id,
            submission_id=request.submission_id,
            media_id=request.media_id,
            failure_code="OCR_TIMEOUT",
            failure_message="OCR timed out.",
            retryable=True,
            attempt=request.attempt,
        )
        worker, store, producer, consumer = self.make_worker(
            Claim(
                should_process=False,
                topic="document.classification.failed.v1",
                payload=json.loads(failed.model_dump_json(by_alias=True)),
            )
        )
        worker._processor = AsyncMock()

        await worker._handle_record(make_record(request.model_dump_json(by_alias=True).encode()))

        worker._processor.assert_not_awaited()
        self.assertEqual(store.published, [request.classification_run_id])
        self.assertEqual(producer.messages[0][0], "document.classification.failed.v1")
        self.assertEqual(json.loads(producer.messages[0][2])["failureCode"], "OCR_TIMEOUT")
        self.assertEqual(consumer.commits[0][2], 6)

    async def test_newer_attempt_is_processed_after_republishing_older_pending_result(self) -> None:
        request = make_request().model_copy(update={"attempt": 2})
        old_result = ClassificationFailedEvent(
            classification_run_id=request.classification_run_id,
            document_id=request.document_id,
            submission_id=request.submission_id,
            media_id=request.media_id,
            failure_code="OCR_TIMEOUT",
            failure_message="OCR timed out.",
            retryable=True,
            attempt=1,
        )
        worker, store, producer, consumer = self.make_worker(
            [
                Claim(
                    should_process=False,
                    topic="document.classification.failed.v1",
                    payload=json.loads(old_result.model_dump_json(by_alias=True)),
                    attempt=1,
                ),
                Claim(should_process=True, attempt=2, lease_until=datetime.now(timezone.utc) + timedelta(minutes=5)),
            ]
        )
        worker._processor = AsyncMock(
            return_value=(
                "document.classification.failed.v1",
                ClassificationFailedEvent(
                    classification_run_id=request.classification_run_id,
                    document_id=request.document_id,
                    submission_id=request.submission_id,
                    media_id=request.media_id,
                    failure_code="PROCESSING_ERROR",
                    failure_message="Retry failed.",
                    retryable=True,
                    attempt=2,
                ).model_dump_json(by_alias=True),
            )
        )

        await worker._handle_record(make_record(request.model_dump_json(by_alias=True).encode()))

        self.assertEqual(store.claim_calls, 2)
        worker._processor.assert_awaited_once()
        self.assertEqual(len(producer.messages), 2)
        self.assertEqual(json.loads(producer.messages[1][2])["attempt"], 2)
        self.assertEqual(consumer.commits[0][2], 6)

    async def test_worker_does_not_publish_when_lease_fenced_result_save_fails(self) -> None:
        request = make_request()
        worker, store, producer, consumer = self.make_worker(
            Claim(
                should_process=True,
                lease_until=datetime.now(timezone.utc) + timedelta(minutes=5),
                attempt=1,
            )
        )
        store.save_succeeds = False
        worker._processor = AsyncMock(
            return_value=(
                "document.classification.failed.v1",
                ClassificationFailedEvent(
                    classification_run_id=request.classification_run_id,
                    document_id=request.document_id,
                    submission_id=request.submission_id,
                    media_id=request.media_id,
                    failure_code="PROCESSING_ERROR",
                    failure_message="Processing failed.",
                    retryable=True,
                    attempt=1,
                ).model_dump_json(by_alias=True),
            )
        )

        with self.assertRaises(RuntimeError):
            await worker._handle_record(make_record(request.model_dump_json(by_alias=True).encode()))

        self.assertEqual(producer.messages, [])
        self.assertEqual(consumer.commits, [])

    async def test_worker_cancels_processing_when_lease_renewal_loses_ownership(self) -> None:
        request = make_request()
        lease_token = datetime.now(timezone.utc) + timedelta(minutes=5)
        worker, store, _, _ = self.make_worker(
            Claim(should_process=True, attempt=1, lease_until=lease_token)
        )
        store.renew_succeeds = False
        processing_started = asyncio.Event()
        processing_cancelled = asyncio.Event()

        async def wait_until_cancelled(_: ClassificationRequestedEvent) -> tuple[str, str]:
            processing_started.set()
            try:
                await asyncio.Event().wait()
            finally:
                processing_cancelled.set()

        worker._processor = AsyncMock(side_effect=wait_until_cancelled)

        with patch("src.worker.runtime.asyncio.sleep", new=AsyncMock(return_value=None)):
            with self.assertRaises(LeaseOwnershipLost):
                await worker._process_with_lease(request, lease_token)

        self.assertTrue(processing_started.is_set())
        self.assertTrue(processing_cancelled.is_set())

    async def test_published_output_is_canonical_schema_serialization(self) -> None:
        request = make_request()
        worker, store, producer, _ = self.make_worker(
            Claim(
                should_process=True,
                lease_until=datetime.now(timezone.utc) + timedelta(minutes=5),
                attempt=1,
            )
        )
        worker._processor = AsyncMock(
            return_value=(
                "document.classification.failed.v1",
                json.dumps(
                    {
                        "classification_run_id": request.classification_run_id,
                        "document_id": str(request.document_id),
                        "submission_id": str(request.submission_id),
                        "media_id": str(request.media_id),
                        "failure_code": "PROCESSING_ERROR",
                        "failure_message": "Processing failed.",
                        "retryable": True,
                        "attempt": 1,
                    }
                ),
            )
        )

        await worker._handle_record(make_record(request.model_dump_json(by_alias=True).encode()))

        self.assertIn('"eventId"', store.saved[2])
        self.assertIn('"occurredAt"', store.saved[2])
        self.assertNotIn('"event_id"', store.saved[2])
        self.assertEqual(producer.messages[0][2], store.saved[2])


class JobStoreLeaseTests(unittest.IsolatedAsyncioTestCase):
    async def test_expired_processing_lease_is_replaced_with_a_future_lease(self) -> None:
        class Result:
            def __init__(self, inserted_id: str | None = None, row: dict[str, Any] | None = None) -> None:
                self._inserted_id = inserted_id
                self._row = row

            def scalar_one_or_none(self) -> str | None:
                return self._inserted_id

            def mappings(self) -> "Result":
                return self

            def one(self) -> dict[str, Any]:
                return self._row or {}

        class Connection:
            def __init__(self) -> None:
                self.execute = AsyncMock(side_effect=[
                    Result(),
                    Result(row={
                        "status": "PROCESSING",
                        "attempt": 1,
                        "lease_until": datetime(2000, 1, 1, tzinfo=timezone.utc),
                        "result_topic": None,
                        "result_payload": None,
                    }),
                    Result(),
                ])

        class Transaction:
            def __init__(self, connection: Connection) -> None:
                self.connection = connection

            async def __aenter__(self) -> Connection:
                return self.connection

            async def __aexit__(self, *args: object) -> None:
                return None

        class Engine:
            def __init__(self, connection: Connection) -> None:
                self.connection = connection

            def begin(self) -> Transaction:
                return Transaction(self.connection)

        connection = Connection()
        store = JobStore(Engine(connection), lease_seconds=300)  # type: ignore[arg-type]

        claim = await store.claim("run_1", 1)

        self.assertTrue(claim.should_process)
        update_params = connection.execute.await_args_list[2].args[1]
        self.assertGreater(update_params["lease_until"], datetime.now(timezone.utc))

    async def test_save_result_is_fenced_by_live_lease_token(self) -> None:
        class Result:
            def scalar_one_or_none(self) -> str | None:
                return None

        class Connection:
            def __init__(self) -> None:
                self.execute = AsyncMock(return_value=Result())

        class Transaction:
            def __init__(self, connection: Connection) -> None:
                self.connection = connection

            async def __aenter__(self) -> Connection:
                return self.connection

            async def __aexit__(self, *args: object) -> None:
                return None

        class Engine:
            def __init__(self, connection: Connection) -> None:
                self.connection = connection

            def begin(self) -> Transaction:
                return Transaction(self.connection)

        connection = Connection()
        store = JobStore(Engine(connection), lease_seconds=300)  # type: ignore[arg-type]
        token = datetime.now(timezone.utc) + timedelta(seconds=30)

        saved = await store.save_result("run_1", "topic", "{}", token)

        self.assertFalse(saved)
        sql = str(connection.execute.await_args.args[0])
        self.assertIn("lease_until", sql)
        self.assertIn(":lease_token", sql)
        self.assertEqual(connection.execute.await_args.args[1]["lease_token"], token)

    async def test_renew_lease_returns_a_new_fencing_token(self) -> None:
        class Result:
            def __init__(self, token: datetime) -> None:
                self.token = token

            def scalar_one_or_none(self) -> datetime:
                return self.token

        class Connection:
            def __init__(self) -> None:
                self.execute = AsyncMock(return_value=Result(datetime.now(timezone.utc) + timedelta(minutes=5)))

        class Transaction:
            def __init__(self, connection: Connection) -> None:
                self.connection = connection

            async def __aenter__(self) -> Connection:
                return self.connection

            async def __aexit__(self, *args: object) -> None:
                return None

        class Engine:
            def __init__(self, connection: Connection) -> None:
                self.connection = connection

            def begin(self) -> Transaction:
                return Transaction(self.connection)

        connection = Connection()
        store = JobStore(Engine(connection), lease_seconds=300)  # type: ignore[arg-type]
        token = datetime.now(timezone.utc) + timedelta(seconds=30)

        renewed = await store.renew_lease("run_1", token)

        self.assertIsNotNone(renewed)
        self.assertGreater(renewed, token)
        self.assertIn(":lease_token", str(connection.execute.await_args.args[0]))

