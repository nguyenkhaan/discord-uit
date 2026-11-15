from dataclasses import dataclass

from src.service.catalogue_cache import CatalogueIndex, EmbeddingClient, EntryKind, RetrievedEntry
from src.service.extraction import ExtractedDocument

TAG_LIMIT = 8
COLLECTION_LIMIT = 5


@dataclass(frozen=True)
class RetrievalResult:
    tags: list[RetrievedEntry]
    collections: list[RetrievedEntry]
    was_truncated: bool


def retrieve_candidates(
    document: ExtractedDocument,
    index: CatalogueIndex,
    client: EmbeddingClient,
    chunk_size: int = 4_000,
    max_chunks: int = 12,
) -> RetrievalResult:
    chunks, was_truncated = chunk_document(document.text, chunk_size, max_chunks)
    vectors = client.embed(chunks)
    if len(vectors) != len(chunks):
        raise ValueError("embedding provider returned an unexpected vector count")

    return RetrievalResult(
        tags=_rank_candidates(index, vectors, "tag", TAG_LIMIT),
        collections=_rank_candidates(index, vectors, "collection", COLLECTION_LIMIT),
        was_truncated=was_truncated,
    )


def chunk_document(text: str, chunk_size: int, max_chunks: int) -> tuple[list[str], bool]:
    if chunk_size <= 0 or max_chunks <= 0:
        raise ValueError("chunk_size and max_chunks must be positive")
    chunks = [text[start : start + chunk_size] for start in range(0, len(text), chunk_size)]
    return chunks[:max_chunks], len(chunks) > max_chunks


def _rank_candidates(
    index: CatalogueIndex,
    vectors: list[list[float]],
    kind: EntryKind,
    limit: int,
) -> list[RetrievedEntry]:
    best_by_id: dict[str, RetrievedEntry] = {}
    for vector in vectors:
        for candidate in index.search(vector, kind, limit):
            current = best_by_id.get(candidate.entry.id)
            if current is None or candidate.similarity > current.similarity:
                best_by_id[candidate.entry.id] = candidate
    return sorted(best_by_id.values(), key=lambda item: (-item.similarity, item.entry.id))[:limit]
