import asyncio
import contextlib
import json
import logging
from collections.abc import Awaitable, Callable
from datetime import datetime

from aiokafka import AIOKafkaProducer
from aiokafka.structs import ConsumerRecord
from pydantic import ValidationError
from sqlalchemy import make_url, text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from src.config.setting import Settings, get_settings
from src.contract.classification_event import (
    ClassificationCompletedEvent,
    ClassificationFailedEvent,
    ClassificationRequestedEvent,
)
from src.content.file_probe import ContentProcessingError
from src.worker.job_store import JobStore
from src.worker.kafka_consumer import KafkaConsumer
from src.worker.kafka_producer import KafkaProducer

logger = logging.getLogger(__name__)

Processor = Callable[[ClassificationRequestedEvent], Awaitable[tuple[str, str]]]


class LeaseOwnershipLost(RuntimeError):
    pass


def _async_database_url(database_url: str) -> str:
    url = make_url(database_url)
    if url.drivername not in {"postgresql", "postgresql+psycopg2", "postgresql+asyncpg"}:
        raise RuntimeError("DATABASE_URL must use PostgreSQL.")

    query = dict(url.query)
    sslmode = query.pop("sslmode", None)
    if sslmode is not None and "ssl" not in query:
        query["ssl"] = sslmode
    pgbouncer = query.pop("pgbouncer", None)
    if pgbouncer is not None and str(pgbouncer).lower() in {"true", "1"}:
        query.setdefault("prepared_statement_cache_size", "0")
    return url.set(drivername="postgresql+asyncpg", query=query).render_as_string(
        hide_password=False
    )


class ClassificationWorker:
    def __init__(
        self,
        settings: Settings | None = None,
        processor: Processor | None = None,
    ) -> None:
        self._settings = settings or get_settings()

        if self._settings.database_url is None:
            raise RuntimeError("DATABASE_URL is required for the classification worker.")

        self._processor = processor or self._pipeline_not_ready
        self._engine: AsyncEngine | None = None
        self._job_store: JobStore | None = None
        self._consumer: KafkaConsumer | None = None
        self._raw_producer: AIOKafkaProducer | None = None
        self._producer: KafkaProducer | None = None
        self._task: asyncio.Task[None] | None = None
        self._ready = False

    @property
    def is_ready(self) -> bool:
        return self._ready and self._task is not None and not self._task.done()

    async def start(self) -> None:
        if self._ready:
            return

        engine = create_async_engine(
            _async_database_url(str(self._settings.database_url)),
            pool_pre_ping=True,
        )
        consumer = KafkaConsumer(self._settings)
        raw_producer = AIOKafkaProducer(
            bootstrap_servers=self._settings.kafka_bootstrap_servers,
            client_id=self._settings.service_id,
            acks="all",
            enable_idempotence=True,
            request_timeout_ms=self._settings.kafka_request_timeout_ms,
        )
        self._engine = engine
        self._job_store = JobStore(engine, self._settings.job_lease_seconds)
        self._consumer = consumer
        self._raw_producer = raw_producer
        self._producer = KafkaProducer(raw_producer)

        try:
            async with engine.connect() as connection:
                await connection.execute(text("SELECT 1"))
            await raw_producer.start()
            await consumer.start()
            self._task = asyncio.create_task(
                self._consume_forever(),
                name="classification-kafka-worker",
            )
        except Exception:
            await self.stop()
            raise

        self._ready = True

    async def stop(self) -> None:
        self._ready = False

        if self._task is not None:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task
            self._task = None

        if self._consumer is not None:
            await self._consumer.stop()
            self._consumer = None
        if self._raw_producer is not None:
            await self._raw_producer.stop()
            self._raw_producer = None
        if self._engine is not None:
            await self._engine.dispose()
            self._engine = None

        self._producer = None
        self._job_store = None

    async def _consume_forever(self) -> None:
        assert self._consumer is not None
        consumer = self._consumer

        while True:
            try:
                record = await consumer.getone()
            except asyncio.CancelledError:
                raise
            except Exception as error:
                logger.error(
                    "Classification Kafka poll failed: error_type=%s",
                    type(error).__name__,
                )
                await asyncio.sleep(1)
                continue

            try:
                await self._handle_record(record)
            except asyncio.CancelledError:
                raise
            except Exception as error:
                logger.error(
                    "Classification Kafka processing failed: topic=%s partition=%s offset=%s error_type=%s",
                    record.topic,
                    record.partition,
                    record.offset,
                    type(error).__name__,
                )
                await asyncio.sleep(1)
                consumer.seek(record.topic, record.partition, record.offset)

    async def _handle_record(self, record: ConsumerRecord[bytes, bytes]) -> None:
        assert self._job_store is not None
        assert self._producer is not None

        if record.value is None or len(record.value) > self._settings.max_kafka_event_bytes:
            await self._publish_invalid_event(record, "INVALID_EVENT")
            await self._commit(record)
            return

        try:
            request = ClassificationRequestedEvent.model_validate_json(record.value)
        except ValidationError:
            await self._publish_invalid_event(record, "INVALID_EVENT")
            await self._commit(record)
            return

        while True:
            claim = await self._job_store.claim(
                request.classification_run_id,
                request.attempt,
            )
            if claim.wait_seconds > 0:
                await asyncio.sleep(min(claim.wait_seconds, 5))
                continue

            if claim.topic is not None and claim.payload is not None:
                payload = (
                    claim.payload
                    if isinstance(claim.payload, str)
                    else json.dumps(claim.payload, separators=(",", ":"))
                )
                await self._producer.publish(
                    claim.topic,
                    request.classification_run_id,
                    payload,
                )
                await self._job_store.mark_published(request.classification_run_id)
                if claim.attempt is not None and request.attempt > claim.attempt:
                    # Replay the stored result first, then acquire the newer retry attempt.
                    continue
                await self._commit(record)
                return

            if claim.topic is not None or claim.payload is not None:
                raise RuntimeError("The persisted classification result is incomplete.")
            break

        if not claim.should_process:
            # A published duplicate is acknowledged without processing again.
            await self._commit(record)
            return

        if claim.lease_until is None:
            raise RuntimeError("The claimed classification job has no lease token.")
        topic, payload, lease_token = await self._process_with_lease(
            request,
            claim.lease_until,
        )

        saved = await self._job_store.save_result(
            request.classification_run_id,
            topic,
            payload,
            lease_token,
        )
        if not saved:
            raise LeaseOwnershipLost("The worker no longer owns this classification lease.")
        await self._producer.publish(
            topic,
            request.classification_run_id,
            payload,
        )
        await self._job_store.mark_published(request.classification_run_id)
        await self._commit(record)

    async def _process_with_lease(
        self,
        request: ClassificationRequestedEvent,
        initial_lease_token: datetime,
    ) -> tuple[str, str, datetime]:
        assert self._job_store is not None

        lease_token = [initial_lease_token]
        processing_task = asyncio.create_task(self._process_with_bounded_retries(request))
        renewal_task = asyncio.create_task(
            self._renew_lease(request.classification_run_id, lease_token)
        )
        try:
            done, _ = await asyncio.wait(
                {processing_task, renewal_task},
                return_when=asyncio.FIRST_COMPLETED,
            )
            if renewal_task in done:
                renewal_error = renewal_task.exception()
                processing_task.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await processing_task
                if renewal_error is not None:
                    raise renewal_error
                raise LeaseOwnershipLost("The worker lease renewal stopped unexpectedly.")

            topic, payload = await processing_task
            return topic, payload, lease_token[0]
        finally:
            if not renewal_task.done():
                renewal_task.cancel()
                with contextlib.suppress(asyncio.CancelledError):
                    await renewal_task

    async def _renew_lease(
        self,
        run_id: str,
        lease_token: list[datetime],
    ) -> None:
        assert self._job_store is not None

        renewal_interval = max(1, min(10, self._settings.job_lease_seconds // 3))
        while True:
            await asyncio.sleep(renewal_interval)
            renewed_token = await self._job_store.renew_lease(run_id, lease_token[0])
            if renewed_token is None:
                raise LeaseOwnershipLost("The worker no longer owns this classification lease.")
            lease_token[0] = renewed_token

    async def _process_with_bounded_retries(
        self,
        request: ClassificationRequestedEvent,
    ) -> tuple[str, str]:
        last_error: Exception | None = None
        for attempt in range(self._settings.worker_processing_attempts):
            try:
                topic, payload = await self._processor(request)
                try:
                    payload = self._validate_output(request, topic, payload)
                except (ValidationError, ValueError):
                    raise ContentProcessingError(
                        "INVALID_WORKER_OUTPUT",
                        "The worker produced an invalid classification result.",
                    ) from None
                return topic, payload
            except asyncio.CancelledError:
                raise
            except Exception as error:
                last_error = error
                retryable = not isinstance(error, ContentProcessingError) or error.retryable
                if not retryable or attempt + 1 == self._settings.worker_processing_attempts:
                    break
                delay = self._settings.worker_retry_backoff_ms * (2**attempt) / 1000
                await asyncio.sleep(delay)

        failure = self._failure_event(request, last_error)
        payload = failure.model_dump_json(by_alias=True)
        payload = self._validate_output(request, self._settings.kafka_failed_topic, payload)
        return self._settings.kafka_failed_topic, payload

    def _failure_event(
        self,
        request: ClassificationRequestedEvent,
        error: Exception | None,
    ) -> ClassificationFailedEvent:
        if isinstance(error, ContentProcessingError):
            code = error.code
            message = error.safe_message
            retryable = error.retryable
        else:
            code = "PROCESSING_ERROR"
            message = "Document processing failed after the retry limit."
            retryable = True

        return ClassificationFailedEvent(
            classification_run_id=request.classification_run_id,
            document_id=request.document_id,
            submission_id=request.submission_id,
            media_id=request.media_id,
            failure_code=code,
            failure_message=message,
            retryable=retryable,
            attempt=request.attempt,
        )

    def _validate_output(
        self,
        request: ClassificationRequestedEvent,
        topic: str,
        payload: str,
    ) -> str:
        if topic == self._settings.kafka_completed_topic:
            event = ClassificationCompletedEvent.model_validate_json(payload)
        elif topic == self._settings.kafka_failed_topic:
            event = ClassificationFailedEvent.model_validate_json(payload)
        else:
            raise ValueError("The worker produced an unsupported classification topic.")

        if (
            event.classification_run_id != request.classification_run_id
            or event.document_id != request.document_id
            or event.submission_id != request.submission_id
            or event.media_id != request.media_id
            or event.attempt != request.attempt
        ):
            raise ValueError("The worker output identity does not match its request.")
        return event.model_dump_json(by_alias=True)

    async def _publish_invalid_event(
        self,
        record: ConsumerRecord[bytes, bytes],
        failure_code: str,
    ) -> None:
        assert self._producer is not None

        # Không publish raw payload sang DLQ vì payload có thể chứa signed URL.
        await self._producer.publish(
            self._settings.kafka_dlq_topic,
            f"{record.topic}:{record.partition}:{record.offset}",
            json.dumps(
                {
                    "schemaVersion": "v1",
                    "failureCode": failure_code,
                    "sourceTopic": record.topic,
                    "sourcePartition": record.partition,
                    "sourceOffset": record.offset,
                }
            ),
        )

    async def _commit(self, record: ConsumerRecord[bytes, bytes]) -> None:
        assert self._consumer is not None

        await self._consumer.commit(record.topic, record.partition, record.offset + 1)

    async def _pipeline_not_ready(
        self,
        request: ClassificationRequestedEvent,
    ) -> tuple[str, str]:
        event = ClassificationFailedEvent(
            classification_run_id=request.classification_run_id,
            document_id=request.document_id,
            submission_id=request.submission_id,
            media_id=request.media_id,
            failure_code="PIPELINE_NOT_IMPLEMENTED",
            failure_message="OCR and classification pipeline is not deployed yet.",
            retryable=False,
            attempt=request.attempt,
        )
        return (
            self._settings.kafka_failed_topic,
            event.model_dump_json(by_alias=True),
        )
