import unittest

from aiokafka.errors import IllegalStateError
from aiokafka.structs import TopicPartition

from src.config.setting import Settings
from src.worker.kafka_consumer import KafkaConsumer


class RevokedPartitionConsumer:
    def __init__(self) -> None:
        self.seek_calls = 0

    def assignment(self) -> set[TopicPartition]:
        return set()

    def seek(self, partition: TopicPartition, offset: int) -> None:
        self.seek_calls += 1
        raise IllegalStateError("partition is no longer assigned")


class RebalanceRaceConsumer(RevokedPartitionConsumer):
    def assignment(self) -> set[TopicPartition]:
        return {TopicPartition("document.classification.requested.v1", 0)}


class KafkaConsumerRecoveryTests(unittest.TestCase):
    def test_seek_skips_partition_revoked_during_record_processing(self) -> None:
        consumer = KafkaConsumer(Settings(_env_file=None))
        fake = RevokedPartitionConsumer()
        consumer._consumer = fake  # type: ignore[assignment]

        repositioned = consumer.seek("document.classification.requested.v1", 0, 5)

        self.assertFalse(repositioned)
        self.assertEqual(fake.seek_calls, 0)

    def test_seek_handles_partition_revocation_between_check_and_seek(self) -> None:
        consumer = KafkaConsumer(Settings(_env_file=None))
        fake = RebalanceRaceConsumer()
        consumer._consumer = fake  # type: ignore[assignment]

        repositioned = consumer.seek("document.classification.requested.v1", 0, 5)

        self.assertFalse(repositioned)
        self.assertEqual(fake.seek_calls, 1)
