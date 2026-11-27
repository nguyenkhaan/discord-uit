import asyncio
import contextlib
import json
import sys
from asyncio.subprocess import Process

from src.content.file_probe import ContentProcessingError


class RapidOcrProvider:
    def __init__(self, cpu_threads: int = 2) -> None:
        self._cpu_threads = cpu_threads
        self._process: Process | None = None
        self._lock = asyncio.Lock()

    async def extract_text(self, image_bytes: bytes) -> str:
        if not image_bytes:
            raise ContentProcessingError("EMPTY_OCR_IMAGE", "The OCR page image is empty.")

        async with self._lock:
            process = await self._get_process()
            try:
                if process.stdin is None or process.stdout is None:
                    raise RuntimeError("RapidOCR process pipes are unavailable.")
                process.stdin.write(len(image_bytes).to_bytes(4, byteorder="big"))
                process.stdin.write(image_bytes)
                await process.stdin.drain()
                response_bytes = await process.stdout.readline()
                if not response_bytes:
                    raise RuntimeError("RapidOCR worker exited without a response.")

                response = json.loads(response_bytes)
                if not isinstance(response, dict) or response.get("error"):
                    raise ValueError
                lines = response["lines"]
                if not isinstance(lines, list) or not all(isinstance(line, str) for line in lines):
                    raise ValueError
                return "\n".join(line.strip() for line in lines if line.strip())
            except asyncio.CancelledError:
                await self._stop_process()
                raise
            except ContentProcessingError:
                await self._stop_process()
                raise
            except Exception:
                await self._stop_process()
                raise ContentProcessingError(
                    "OCR_PROVIDER_ERROR",
                    "RapidOCR could not process this page.",
                    retryable=True,
                ) from None

    async def aclose(self) -> None:
        async with self._lock:
            process = self._process
            self._process = None
            if process is None:
                return

            if process.stdin is not None:
                with contextlib.suppress(Exception):
                    process.stdin.close()
                    await process.stdin.wait_closed()
            try:
                await asyncio.wait_for(process.wait(), timeout=2)
            except TimeoutError:
                await self._kill_and_reap(process)
            except BaseException:
                await self._kill_and_reap(process)
                raise

    async def _get_process(self) -> Process:
        if self._process is not None and self._process.returncode is None:
            return self._process
        if self._process is not None:
            await self._stop_process()

        try:
            process = await asyncio.create_subprocess_exec(
                sys.executable,
                "-m",
                "src.agentic.rapid_ocr_worker",
                str(self._cpu_threads),
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.DEVNULL,
                limit=4 * 1024 * 1024,
            )
        except OSError:
            raise ContentProcessingError(
                "OCR_PROVIDER_NOT_CONFIGURED",
                "The RapidOCR worker could not be started.",
            ) from None
        self._process = process
        return process

    async def _stop_process(self) -> None:
        process = self._process
        self._process = None
        if process is None:
            return
        if process.returncode is None:
            with contextlib.suppress(ProcessLookupError):
                process.kill()
        with contextlib.suppress(ProcessLookupError):
            await process.wait()

    @staticmethod
    async def _kill_and_reap(process: Process) -> None:
        if process.returncode is None:
            with contextlib.suppress(ProcessLookupError):
                process.kill()
        with contextlib.suppress(ProcessLookupError):
            await process.wait()
