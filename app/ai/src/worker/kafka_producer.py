from aiokafka import AIOKafkaProducer


class KafkaProducer:
    def __init__(self, producer: AIOKafkaProducer) -> None:
        self._producer = producer

    async def publish(self, topic: str, key: str, payload: str) -> None:
        await self._producer.send_and_wait(
            topic=topic,
            key=key.encode("utf-8"),
            value=payload.encode("utf-8"),
        )