from typing import cast

from aiokafka import AIOKafkaConsumer
from aiokafka.errors import IllegalStateError
from aiokafka.structs import ConsumerRecord, OffsetAndMetadata, TopicPartition

from src.config.setting import Settings


class KafkaConsumer:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._consumer: AIOKafkaConsumer | None = None

    async def start(self) -> None:
        if self._consumer is not None:
            return
        consumer = AIOKafkaConsumer(
            self._settings.kafka_requested_topic,
            bootstrap_servers=self._settings.kafka_bootstrap_servers,
            client_id=self._settings.service_id,
            group_id=self._settings.kafka_group_id,
            enable_auto_commit=False,
            auto_offset_reset="earliest",
            max_poll_interval_ms=max(
                300_000,
                (
                    self._settings.ocr_timeout_seconds
                    + self._settings.llm_timeout_seconds
                    + self._settings.document_download_timeout_seconds
                    + 60
                )
                * 1000,
            ),
        )
        await consumer.start()
        self._consumer = consumer

    async def stop(self) -> None:
        if self._consumer is not None:
            consumer = self._consumer
            self._consumer = None
            await consumer.stop()

    async def getone(self) -> ConsumerRecord[bytes, bytes]:
        if self._consumer is None:
            raise RuntimeError("Kafka consumer is not started.")
        return cast(ConsumerRecord[bytes, bytes], await self._consumer.getone())

    async def commit(self, topic: str, partition: int, offset: int) -> None:
        if self._consumer is None:
            raise RuntimeError("Kafka consumer is not started.")
        await self._consumer.commit(
            {
                TopicPartition(topic, partition): OffsetAndMetadata(offset, ""),
            }
        )

    def seek(self, topic: str, partition: int, offset: int) -> bool:
        if self._consumer is None:
            raise RuntimeError("Kafka consumer is not started.")
        topic_partition = TopicPartition(topic, partition)
        if topic_partition not in self._consumer.assignment():
            return False
        try:
            self._consumer.seek(topic_partition, offset)
        except IllegalStateError:
            # The partition can be revoked between checking assignment and seeking.
            return False
        return True
