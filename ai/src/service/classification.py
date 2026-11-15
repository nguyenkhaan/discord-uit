import json
from dataclasses import dataclass

from src.dto_contract.classification import ExistingSuggestion, NewSuggestion, RawClassification
from src.harness.llm import LLMClient
from src.service.catalogue_cache import RetrievedEntry
from src.service.retrieval import RetrievalResult

TAG_LIMIT = 3
COLLECTION_LIMIT = 2
NEW_SUGGESTION_CONFIDENCE = 0.80
EXISTING_SUITABILITY_CONFIDENCE = 0.60


class ClassificationError(ValueError):
    pass


@dataclass(frozen=True)
class ClassificationResult:
    tags: list[ExistingSuggestion]
    collections: list[ExistingSuggestion]
    new_tags: list[NewSuggestion]
    new_collections: list[NewSuggestion]


def classify(retrieval: RetrievalResult, excerpt: str, client: LLMClient) -> ClassificationResult:
    raw = client.classify(_build_prompt(retrieval, excerpt))
    tag_suggestions = _validate_existing(raw.tags, {item.entry.id for item in retrieval.tags})
    collection_suggestions = _validate_existing(raw.collections, {item.entry.id for item in retrieval.collections})

    return ClassificationResult(
        tags=tag_suggestions[:TAG_LIMIT],
        collections=collection_suggestions[:COLLECTION_LIMIT],
        new_tags=_new_suggestions(raw.new_tags, tag_suggestions, retrieval.tags),
        new_collections=_new_suggestions(raw.new_collections, collection_suggestions, retrieval.collections),
    )


def _build_prompt(retrieval: RetrievalResult, excerpt: str) -> str:
    candidates = {
        "tags": [_candidate_payload(item) for item in retrieval.tags],
        "collections": [_candidate_payload(item) for item in retrieval.collections],
    }
    return (
        "Classify the document excerpt using only the supplied candidate IDs for existing suggestions. "
        "Return confidence between 0 and 1 and a short reason. Score every supplied candidate, including "
        "unsuitable candidates with low confidence. Propose at most one new tag or collection only when no "
        "existing candidate is suitable.\n\n"
        f"Document excerpt:\n{excerpt}\n\nRetrieved candidates:\n"
        f"{json.dumps(candidates, ensure_ascii=False)}"
    )


def _candidate_payload(candidate: RetrievedEntry) -> dict[str, str]:
    entry = candidate.entry
    return {"id": entry.id, "name": entry.name, "slug": entry.slug, "description": entry.description}


def _validate_existing(suggestions: list[ExistingSuggestion], allowed_ids: set[str]) -> list[ExistingSuggestion]:
    by_id: dict[str, ExistingSuggestion] = {}
    for suggestion in suggestions:
        if suggestion.id not in allowed_ids:
            raise ClassificationError(f"LLM returned an ID that was not retrieved: {suggestion.id}")
        current = by_id.get(suggestion.id)
        if current is None or suggestion.confidence > current.confidence:
            by_id[suggestion.id] = suggestion
    return sorted(by_id.values(), key=lambda item: (-item.confidence, item.id))


def _new_suggestions(
    suggestions: list[NewSuggestion],
    existing: list[ExistingSuggestion],
    candidates: list[RetrievedEntry],
) -> list[NewSuggestion]:
    if {item.id for item in existing} != {item.entry.id for item in candidates}:
        return []
    best_existing_confidence = max((item.confidence for item in existing), default=0.0)
    if best_existing_confidence >= EXISTING_SUITABILITY_CONFIDENCE:
        return []
    existing_slugs = {item.entry.slug for item in candidates}
    eligible = [
        item
        for item in suggestions
        if item.confidence >= NEW_SUGGESTION_CONFIDENCE and item.slug not in existing_slugs
    ]
    return [max(eligible, key=lambda item: (item.confidence, item.slug))] if eligible else []
