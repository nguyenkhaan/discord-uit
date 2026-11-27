import asyncio
import unittest
from unittest.mock import AsyncMock, Mock, patch

from src.agentic.ocr_ai import RapidOcrProvider
from src.content.file_probe import ContentProcessingError


class FakeStdin:
    def __init__(self) -> None:
        self.written = bytearray()
        self.closed = False

    def write(self, value: bytes) -> None:
        self.written.extend(value)

    async def drain(self) -> None:
        return None

    def close(self) -> None:
        self.closed = True

    async def wait_closed(self) -> None:
        return None


class FakeStdout:
    def __init__(self, responses: list[bytes]) -> None:
        self.responses = iter(responses)

    async def readline(self) -> bytes:
        return next(self.responses)


class RapidOcrProviderTests(unittest.IsolatedAsyncioTestCase):
    async def test_reuses_worker_and_joins_detected_lines(self) -> None:
        process = Mock(
            returncode=None,
            stdin=FakeStdin(),
            stdout=FakeStdout(
                [
                    b'{"lines":[" First line ","Second line"]}\n',
                    b'{"lines":["Third line"]}\n',
                ]
            ),
            wait=AsyncMock(return_value=0),
        )
        with patch(
            "src.agentic.ocr_ai.asyncio.create_subprocess_exec",
            new=AsyncMock(return_value=process),
        ) as start_process:
            provider = RapidOcrProvider(cpu_threads=3)
            first_result = await provider.extract_text(b"png-one")
            second_result = await provider.extract_text(b"png-two")
            await provider.aclose()

        self.assertEqual(first_result, "First line\nSecond line")
        self.assertEqual(second_result, "Third line")
        self.assertEqual(start_process.await_count, 1)
        self.assertEqual(start_process.await_args.args[1:3], ("-m", "src.agentic.rapid_ocr_worker"))
        self.assertEqual(start_process.await_args.args[3], "3")
        self.assertEqual(
            bytes(process.stdin.written),
            b"\x00\x00\x00\x07png-one\x00\x00\x00\x07png-two",
        )
        self.assertTrue(process.stdin.closed)

    async def test_maps_worker_failure_to_a_safe_content_error(self) -> None:
        process = Mock(
            returncode=None,
            stdin=FakeStdin(),
            stdout=FakeStdout([b"not-json\n"]),
            kill=Mock(),
            wait=AsyncMock(return_value=-9),
        )
        with patch(
            "src.agentic.ocr_ai.asyncio.create_subprocess_exec",
            new=AsyncMock(return_value=process),
        ):
            provider = RapidOcrProvider()
            with self.assertRaises(ContentProcessingError) as raised:
                await provider.extract_text(b"png-image")

        self.assertEqual(raised.exception.code, "OCR_PROVIDER_ERROR")
        self.assertNotIn("not-json", raised.exception.safe_message)
        process.kill.assert_called_once()
        process.wait.assert_awaited_once()

    async def test_cancellation_kills_and_reaps_the_rapidocr_process(self) -> None:
        class BlockingStdout:
            async def readline(self) -> bytes:
                await asyncio.Event().wait()
                return b""

        process = Mock(
            returncode=None,
            stdin=FakeStdin(),
            stdout=BlockingStdout(),
            kill=Mock(),
            wait=AsyncMock(return_value=-9),
        )
        with patch(
            "src.agentic.ocr_ai.asyncio.create_subprocess_exec",
            new=AsyncMock(return_value=process),
        ):
            provider = RapidOcrProvider()
            task = asyncio.create_task(provider.extract_text(b"png-image"))
            await asyncio.sleep(0)
            task.cancel()
            with self.assertRaises(asyncio.CancelledError):
                await task

        process.kill.assert_called_once()
        process.wait.assert_awaited_once()

    async def test_close_waits_for_worker_then_kills_it_if_it_hangs(self) -> None:
        process = Mock(
            returncode=None,
            stdin=FakeStdin(),
            stdout=FakeStdout([b'{"lines":[]}\n']),
            kill=Mock(),
            wait=AsyncMock(side_effect=[asyncio.TimeoutError(), -9]),
        )
        with patch(
            "src.agentic.ocr_ai.asyncio.create_subprocess_exec",
            new=AsyncMock(return_value=process),
        ):
            provider = RapidOcrProvider()
            await provider.extract_text(b"png-image")
            await provider.aclose()

        self.assertTrue(process.stdin.closed)
        process.kill.assert_called_once()
        self.assertEqual(process.wait.await_count, 2)
