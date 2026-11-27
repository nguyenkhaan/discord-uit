import asyncio
import os

from src.config.setting import Settings
from src.content.file_probe import ContentProcessingError


class TesseractOcrProvider:
    def __init__(self, settings: Settings) -> None:
        self._command = settings.tesseract_command
        self._languages = settings.ocr_languages
        self._threads = settings.ocr_cpu_threads

    async def extract_text(self, image_bytes: bytes) -> str:
        try:
            process = await asyncio.create_subprocess_exec(
                self._command,
                "stdin",
                "stdout",
                "--psm",
                "3",
                "-l",
                self._languages,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env={**os.environ, "OMP_THREAD_LIMIT": str(self._threads)},
            )
        except FileNotFoundError:
            raise ContentProcessingError(
                "OCR_PROVIDER_NOT_CONFIGURED",
                "The local OCR engine is not installed.",
            ) from None

        try:
            stdout, _ = await process.communicate(image_bytes)
        except asyncio.CancelledError:
            if process.returncode is None:
                process.kill()
            await process.wait()
            raise

        if process.returncode != 0:
            raise ContentProcessingError(
                "OCR_PROVIDER_ERROR",
                "The local OCR engine could not process this page.",
                retryable=True,
            )
        return stdout.decode("utf-8", errors="replace")
