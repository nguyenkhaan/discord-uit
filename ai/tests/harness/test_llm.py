import json
import traceback

import httpx
import pytest

from src.dto_contract.classification import RawClassification
from src.harness.llm import GroqLLMClient, LLMProviderError


def groq_response(content: str) -> httpx.Response:
    return httpx.Response(200, json={"choices": [{"message": {"content": content}}]})


def valid_payload() -> str:
    return json.dumps(
        {
            "tags": [{"id": "tag-ai", "confidence": 0.91, "reason": "Discusses LLM agents."}],
            "collections": [],
            "new_tags": [],
            "new_collections": [],
        }
    )


def test_classify_parses_structured_groq_response() -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return groq_response(valid_payload())

    client = GroqLLMClient(
        api_key="test-key",
        model="test-model",
        transport=httpx.MockTransport(handler),
    )

    result = client.classify("classify this document")

    assert result == RawClassification.model_validate_json(valid_payload())
    response_format = json.loads(requests[0].content)["response_format"]
    assert response_format["type"] == "json_schema"
    assert response_format["json_schema"]["strict"] is True


def test_classify_repairs_invalid_json_once() -> None:
    responses = iter([groq_response("not json"), groq_response(valid_payload())])
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return next(responses)

    client = GroqLLMClient(api_key="test-key", model="test-model", transport=httpx.MockTransport(handler))

    result = client.classify("classify this document")

    assert result.tags[0].id == "tag-ai"
    assert len(requests) == 2
    assert "invalid" in json.loads(requests[1].content)["messages"][-1]["content"].lower()


def test_classify_hides_api_key_when_provider_times_out() -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("test-key should never be exposed")

    client = GroqLLMClient(
        api_key="test-key",
        model="test-model",
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(LLMProviderError, match="Groq request failed") as error:
        client.classify("classify this document")

    assert "test-key" not in str(error.value)
    assert "test-key" not in "".join(traceback.format_exception(error.value))


def test_classify_stops_after_one_failed_repair() -> None:
    requests: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return groq_response("not json")

    client = GroqLLMClient(api_key="test-key", model="test-model", transport=httpx.MockTransport(handler))

    with pytest.raises(LLMProviderError, match="invalid classification"):
        client.classify("classify this document")

    assert len(requests) == 2
