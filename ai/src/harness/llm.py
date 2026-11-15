import json
from typing import Protocol

import httpx
from pydantic import ValidationError

from src.dto_contract.classification import RawClassification

GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions"


class LLMProviderError(RuntimeError):
    pass


class LLMClient(Protocol):
    def classify(self, prompt: str) -> RawClassification: ...


class GroqLLMClient:
    def __init__(
        self,
        api_key: str,
        model: str,
        transport: httpx.BaseTransport | None = None,
        timeout_seconds: float = 30,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._transport = transport
        self._timeout_seconds = timeout_seconds

    def classify(self, prompt: str) -> RawClassification:
        content = self._request(self._messages(prompt))
        try:
            return RawClassification.model_validate_json(content)
        except (ValidationError, ValueError):
            repair_prompt = (
                "Your previous response was invalid. Return only valid JSON with keys "
                "tags, collections, new_tags, and new_collections. "
                f"Original task:\n{prompt}"
            )
            repaired_content = self._request(self._messages(repair_prompt))
            try:
                return RawClassification.model_validate_json(repaired_content)
            except (ValidationError, ValueError) as error:
                raise LLMProviderError("Groq returned an invalid classification response") from None

    def _messages(self, prompt: str) -> list[dict[str, str]]:
        return [
            {
                "role": "system",
                "content": (
                    "You classify documents. Respond only with a JSON object containing "
                    "tags, collections, new_tags, and new_collections."
                ),
            },
            {"role": "user", "content": prompt},
        ]

    def _request(self, messages: list[dict[str, str]]) -> str:
        try:
            with httpx.Client(transport=self._transport, timeout=self._timeout_seconds) as client:
                response = client.post(
                    GROQ_CHAT_COMPLETIONS_URL,
                    headers={"Authorization": f"Bearer {self._api_key}"},
                    json={
                        "model": self._model,
                        "messages": messages,
                        "temperature": 0,
                        "response_format": {
                            "type": "json_schema",
                            "json_schema": {
                                "name": "document_classification",
                                "strict": True,
                                "schema": RawClassification.model_json_schema(),
                            },
                        },
                    },
                )
                response.raise_for_status()
                payload = response.json()
                content = payload["choices"][0]["message"]["content"]
                if not isinstance(content, str):
                    raise ValueError("response content is missing")
                return content
        except (httpx.HTTPError, KeyError, IndexError, TypeError, ValueError, json.JSONDecodeError) as error:
            raise LLMProviderError("Groq request failed") from None
