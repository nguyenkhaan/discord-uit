import hashlib
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Literal, Protocol
from uuid import uuid4

from data.contract import Catalogue, CatalogueEntry, Collection, Tag
from src.service.catalogue import canonical_text

EntryKind = Literal["tag", "collection"]


class EmbeddingClient(Protocol):
    def embed(self, texts: list[str]) -> list[list[float]]: ...


class EmbeddingError(ValueError):
    pass


@dataclass(frozen=True)
class IndexedEntry:
    kind: EntryKind
    entry: CatalogueEntry
    vector: list[float]


@dataclass(frozen=True)
class RetrievedEntry:
    entry: CatalogueEntry
    similarity: float


@dataclass(frozen=True)
class CatalogueIndex:
    entries: list[IndexedEntry]

    def search(self, query_vector: list[float], kind: EntryKind, limit: int) -> list[RetrievedEntry]:
        ranked = [
            RetrievedEntry(entry=indexed.entry, similarity=cosine_similarity(query_vector, indexed.vector))
            for indexed in self.entries
            if indexed.kind == kind
        ]
        return sorted(ranked, key=lambda item: (-item.similarity, item.entry.id))[:limit]


def load_or_build_index(
    catalogue: Catalogue,
    client: EmbeddingClient,
    cache_path: Path,
    model_id: str,
    dimensions: int = 3072,
) -> CatalogueIndex:
    cached_vectors = _read_cache(cache_path, model_id, dimensions)
    candidates = _catalogue_entries(catalogue)
    missing = [candidate for candidate in candidates if candidate[2] not in cached_vectors]
    vectors = client.embed([canonical_text(entry) for _, entry, _ in missing]) if missing else []

    if len(vectors) != len(missing):
        raise EmbeddingError("embedding provider returned an unexpected vector count")
    if any(not _is_valid_vector(vector, dimensions) for vector in vectors):
        raise EmbeddingError("embedding provider returned an invalid vector")

    combined = dict(cached_vectors)
    for (_, _, content_hash), vector in zip(missing, vectors, strict=True):
        combined[content_hash] = vector

    indexed = [
        IndexedEntry(kind=kind, entry=entry, vector=combined[content_hash])
        for kind, entry, content_hash in candidates
    ]
    _write_cache(cache_path, model_id, dimensions, indexed)
    return CatalogueIndex(entries=indexed)


def cosine_similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right):
        raise ValueError("embedding vectors must have the same dimensions")
    if not _is_valid_vector(left, len(left)) or not _is_valid_vector(right, len(right)):
        raise ValueError("embedding vectors must be finite and non-empty")
    left_norm = math.sqrt(sum(value * value for value in left))
    right_norm = math.sqrt(sum(value * value for value in right))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return sum(a * b for a, b in zip(left, right, strict=True)) / (left_norm * right_norm)


def _catalogue_entries(catalogue: Catalogue) -> list[tuple[EntryKind, CatalogueEntry, str]]:
    tagged = [("tag", entry, _content_hash(entry)) for entry in catalogue.tags]
    collected = [("collection", entry, _content_hash(entry)) for entry in catalogue.collections]
    return tagged + collected


def _content_hash(entry: CatalogueEntry) -> str:
    return hashlib.sha256(canonical_text(entry).encode("utf-8")).hexdigest()


def _read_cache(path: Path, model_id: str, dimensions: int) -> dict[str, list[float]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        if payload["model_id"] != model_id or payload["dimensions"] != dimensions:
            return {}
        vectors = {
            item["content_hash"]: [float(value) for value in item["vector"]]
            for item in payload["entries"]
        }
        if not all(_is_valid_vector(vector, dimensions) for vector in vectors.values()):
            return {}
        return vectors
    except (OSError, json.JSONDecodeError, KeyError, TypeError, ValueError):
        return {}


def _write_cache(path: Path, model_id: str, dimensions: int, entries: list[IndexedEntry]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "model_id": model_id,
        "dimensions": dimensions,
        "entries": [
            {
                "kind": indexed.kind,
                "id": indexed.entry.id,
                "content_hash": _content_hash(indexed.entry),
                "vector": indexed.vector,
            }
            for indexed in entries
        ],
    }
    temporary_path = path.with_name(f".{path.name}.{uuid4().hex}.tmp")
    temporary_path.write_text(json.dumps(payload), encoding="utf-8")
    temporary_path.replace(path)


def _is_valid_vector(vector: list[float], dimensions: int) -> bool:
    return len(vector) == dimensions and all(math.isfinite(value) for value in vector)
