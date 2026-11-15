import pytest

from data.contract import Collection, Tag
from src.dto_contract.classification import ExistingSuggestion, NewSuggestion, RawClassification
from src.service.catalogue_cache import RetrievedEntry
from src.service.classification import ClassificationError, classify
from src.service.retrieval import RetrievalResult


class FakeLLMClient:
    def __init__(self, response: RawClassification) -> None:
        self.response = response
        self.prompts: list[str] = []

    def classify(self, prompt: str) -> RawClassification:
        self.prompts.append(prompt)
        return self.response


def retrieval_result() -> RetrievalResult:
    return RetrievalResult(
        tags=[
            RetrievedEntry(Tag(id="tag-ai", name="AI", slug="ai", description="AI"), 0.9),
            RetrievedEntry(Tag(id="tag-data", name="Data", slug="data", description="Data"), 0.8),
        ],
        collections=[
            RetrievedEntry(
                Collection(id="collection-tech", name="Tech", slug="tech", description="Tech", keywords=[]), 0.9
            )
        ],
        was_truncated=False,
    )


def test_classify_rejects_existing_ids_not_returned_by_retrieval() -> None:
    client = FakeLLMClient(
        RawClassification(
            tags=[ExistingSuggestion(id="tag-unknown", confidence=0.9, reason="Unknown")],
            collections=[],
            new_tags=[],
            new_collections=[],
        )
    )

    with pytest.raises(ClassificationError, match="not retrieved"):
        classify(retrieval_result(), "AI document", client)


def test_classify_caps_and_deduplicates_existing_suggestions() -> None:
    retrieval = RetrievalResult(
        tags=[
            RetrievedEntry(Tag(id=f"tag-{number}", name="Tag", slug=f"tag-{number}", description="D"), 0.9)
            for number in range(4)
        ],
        collections=[],
        was_truncated=False,
    )
    client = FakeLLMClient(
        RawClassification(
            tags=[
                ExistingSuggestion(id="tag-0", confidence=0.7, reason="First"),
                ExistingSuggestion(id="tag-0", confidence=0.9, reason="Better duplicate"),
                ExistingSuggestion(id="tag-1", confidence=0.8, reason="Second"),
                ExistingSuggestion(id="tag-2", confidence=0.75, reason="Third"),
                ExistingSuggestion(id="tag-3", confidence=0.7, reason="Fourth"),
            ],
            collections=[],
            new_tags=[],
            new_collections=[],
        )
    )

    result = classify(retrieval, "AI document", client)

    assert [suggestion.id for suggestion in result.tags] == ["tag-0", "tag-1", "tag-2"]
    assert result.tags[0].reason == "Better duplicate"


@pytest.mark.parametrize(
    ("existing_confidence", "new_confidence", "expected_new_count"),
    [(0.59, 0.8, 1), (0.6, 0.8, 0), (0.2, 0.79, 0)],
)
def test_classify_enforces_new_tag_thresholds(
    existing_confidence: float, new_confidence: float, expected_new_count: int
) -> None:
    client = FakeLLMClient(
        RawClassification(
            tags=[
                ExistingSuggestion(id="tag-ai", confidence=existing_confidence, reason="Existing"),
                ExistingSuggestion(id="tag-data", confidence=existing_confidence, reason="Existing"),
            ],
            collections=[],
            new_tags=[NewSuggestion(name="New Topic", slug="new-topic", confidence=new_confidence, reason="Novel")],
            new_collections=[],
        )
    )

    result = classify(retrieval_result(), "AI document", client)

    assert len(result.new_tags) == expected_new_count


def test_classify_suppresses_new_tag_when_retrieved_candidates_are_not_all_scored() -> None:
    client = FakeLLMClient(
        RawClassification(
            tags=[ExistingSuggestion(id="tag-ai", confidence=0.1, reason="Existing")],
            collections=[],
            new_tags=[NewSuggestion(name="AI", slug="ai", confidence=0.95, reason="Novel")],
            new_collections=[],
        )
    )

    result = classify(retrieval_result(), "AI document", client)

    assert result.new_tags == []


def test_classify_suppresses_new_tag_with_existing_candidate_slug() -> None:
    client = FakeLLMClient(
        RawClassification(
            tags=[
                ExistingSuggestion(id="tag-ai", confidence=0.1, reason="Existing"),
                ExistingSuggestion(id="tag-data", confidence=0.1, reason="Existing"),
            ],
            collections=[],
            new_tags=[NewSuggestion(name="AI Again", slug="ai", confidence=0.95, reason="Novel")],
            new_collections=[],
        )
    )

    result = classify(retrieval_result(), "AI document", client)

    assert result.new_tags == []


def test_classify_keeps_highest_confidence_duplicate_new_tag() -> None:
    client = FakeLLMClient(
        RawClassification(
            tags=[
                ExistingSuggestion(id="tag-ai", confidence=0.1, reason="Existing"),
                ExistingSuggestion(id="tag-data", confidence=0.1, reason="Existing"),
            ],
            collections=[],
            new_tags=[
                NewSuggestion(name="Novel", slug="novel", confidence=0.99, reason="First"),
                NewSuggestion(name="Novel", slug="novel", confidence=0.8, reason="Weaker"),
            ],
            new_collections=[],
        )
    )

    result = classify(retrieval_result(), "AI document", client)

    assert result.new_tags[0].confidence == 0.99


def test_classify_prompt_contains_only_excerpt_and_retrieved_candidates() -> None:
    client = FakeLLMClient(RawClassification(tags=[], collections=[], new_tags=[], new_collections=[]))

    classify(retrieval_result(), "Excerpt about an AI agent", client)

    assert "Excerpt about an AI agent" in client.prompts[0]
    assert "tag-ai" in client.prompts[0]
    assert "collection-tech" in client.prompts[0]
    assert "tag-unknown" not in client.prompts[0]
