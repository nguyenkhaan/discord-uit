import asyncio
from collections.abc import Iterable

import httpx
from src.agentic.output_schema import ClassificationRecommendations
from src.agentic.tools import build_classification_messages
from src.config.setting import Settings
from src.content.file_probe import ContentProcessingError

GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"


class GroqClassificationClient:
    def __init__(
        self,
        settings: Settings,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self._settings = settings
        self._http_client = http_client

    async def recommend(
        self,
        document_text: str,
        collection_slugs: Iterable[str],
        tag_slugs: Iterable[str],
    ) -> ClassificationRecommendations:
        provider = self._settings.llm_provider.strip().lower()
        if provider != "groq":
            raise ContentProcessingError(
                "LLM_PROVIDER_UNSUPPORTED",
                "The configured classification model provider is not supported.",
            )
        if not self._settings.groq_api_key:
            raise ContentProcessingError(
                "LLM_NOT_CONFIGURED",
                "The classification model API key is not configured.",
            )

        allowed_collections = sorted(set(collection_slugs))
        allowed_tags = sorted(set(tag_slugs))
        if not allowed_collections and not allowed_tags:
            return ClassificationRecommendations(collection_suggestions=[], tag_suggestions=[])

        messages = build_classification_messages(
            document_text=document_text[: self._settings.llm_max_input_chars],
            collection_slugs=allowed_collections,
            tag_slugs=allowed_tags,
        )
        request_body = {
            "model": self._settings.llm_model,
            "messages": messages,
            "temperature": 0,
            "response_format": {"type": "json_object"},
        }
        owns_client = self._http_client is None
        client = self._http_client or httpx.AsyncClient(
            timeout=self._settings.llm_timeout_seconds,
            trust_env=False,
        )
        try:
            async with asyncio.timeout(self._settings.llm_timeout_seconds):
                response = await client.post(
                    GROQ_CHAT_COMPLETIONS_URL,
                    headers={"Authorization": f"Bearer {self._settings.groq_api_key}"},
                    json=request_body,
                )
        except (httpx.TimeoutException, TimeoutError):
            raise ContentProcessingError(
                "LLM_TIMEOUT",
                "Document classification exceeded the model time limit.",
                retryable=True,
            ) from None
        except httpx.HTTPError:
            raise ContentProcessingError(
                "LLM_UNAVAILABLE",
                "The classification model is temporarily unavailable.",
                retryable=True,
            ) from None
        finally:
            if owns_client:
                await client.aclose()

        if response.is_error:
            retryable = response.status_code == 429 or response.status_code >= 500
            safe_message = (
                "The classification model is temporarily unavailable."
                if retryable
                else "The classification model rejected the request."
            )
            raise ContentProcessingError(
                "LLM_PROVIDER_ERROR",
                safe_message,
                retryable=retryable,
            )

        try:
            content = response.json()["choices"][0]["message"]["content"]
            if not isinstance(content, str):
                raise ValueError
            result = ClassificationRecommendations.model_validate_json(content)
            result.validate_taxonomy(
                collection_slugs=set(allowed_collections),
                tag_slugs=set(allowed_tags),
            )
        except (KeyError, IndexError, TypeError, ValueError):
            raise ContentProcessingError(
                "INVALID_CLASSIFICATION_OUTPUT",
                "The classification model returned an invalid structured result.",
                retryable=True,
            ) from None
        return result
