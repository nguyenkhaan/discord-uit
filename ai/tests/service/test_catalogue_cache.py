import json
from pathlib import Path

import pytest

from data.contract import Catalogue, Collection, Tag
from src.service.catalogue import canonical_text
from src.service.catalogue_cache import CatalogueIndex, EmbeddingClient, IndexedEntry, load_or_build_index


class RecordingEmbeddingClient(EmbeddingClient):
    def __init__(self) -> None:
        self.calls: list[list[str]] = []

    def embed(self, texts: list[str]) -> list[list[float]]:
        self.calls.append(texts)
        return [[float(index + 1), 1.0] for index, _ in enumerate(texts)]


def make_catalogue(tag_description: str = "Project research") -> Catalogue:
    return Catalogue(
        tags=[Tag(id="tag-research", name="Research", slug="research", description=tag_description)],
        collections=[
            Collection(
                id="collection-research",
                name="Research",
                slug="research-documents",
                description="Research documents",
                keywords=["paper"],
            )
        ],
    )


def test_unchanged_catalogue_reuses_cached_vectors(tmp_path: Path) -> None:
    cache_path = tmp_path / "catalogue_embeddings.json"
    first_client = RecordingEmbeddingClient()

    first_index = load_or_build_index(make_catalogue(), first_client, cache_path, "gemini-embedding-2", dimensions=2)
    second_client = RecordingEmbeddingClient()
    second_index = load_or_build_index(make_catalogue(), second_client, cache_path, "gemini-embedding-2", dimensions=2)

    assert len(first_index.entries) == 2
    assert first_client.calls == [[
        canonical_text(entry) for entry in [*make_catalogue().tags, *make_catalogue().collections]
    ]]
    assert second_client.calls == []
    assert second_index.entries == first_index.entries


def test_changed_entry_reembeds_only_that_entry(tmp_path: Path) -> None:
    cache_path = tmp_path / "catalogue_embeddings.json"
    load_or_build_index(make_catalogue(), RecordingEmbeddingClient(), cache_path, "gemini-embedding-2", dimensions=2)
    changed_catalogue = make_catalogue(tag_description="Updated project research")
    client = RecordingEmbeddingClient()

    load_or_build_index(changed_catalogue, client, cache_path, "gemini-embedding-2", dimensions=2)

    assert client.calls == [[canonical_text(changed_catalogue.tags[0])]]


def test_corrupt_cache_rebuilds_all_vectors(tmp_path: Path) -> None:
    cache_path = tmp_path / "catalogue_embeddings.json"
    cache_path.write_text("not json", encoding="utf-8")
    client = RecordingEmbeddingClient()

    index = load_or_build_index(make_catalogue(), client, cache_path, "gemini-embedding-2", dimensions=2)

    assert len(index.entries) == 2
    assert len(client.calls) == 1
    assert cache_path.read_text(encoding="utf-8").startswith("{")


@pytest.mark.parametrize("invalid_vector", [[], [1.0], [float("nan"), 1.0]])
def test_invalid_cached_vectors_trigger_a_full_rebuild(tmp_path: Path, invalid_vector: list[float]) -> None:
    cache_path = tmp_path / "catalogue_embeddings.json"
    load_or_build_index(make_catalogue(), RecordingEmbeddingClient(), cache_path, "gemini-embedding-2", dimensions=2)
    payload = json.loads(cache_path.read_text(encoding="utf-8"))
    payload["entries"][0]["vector"] = invalid_vector
    cache_path.write_text(json.dumps(payload), encoding="utf-8")
    client = RecordingEmbeddingClient()

    load_or_build_index(make_catalogue(), client, cache_path, "gemini-embedding-2", dimensions=2)

    assert len(client.calls) == 1
    assert len(client.calls[0]) == 2


def test_unreadable_cache_triggers_a_full_rebuild(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    cache_path = tmp_path / "catalogue_embeddings.json"
    cache_path.write_text("{}", encoding="utf-8")
    original_read_text = Path.read_text

    def raise_permission_error(path: Path, *args: object, **kwargs: object) -> str:
        if path == cache_path:
            raise PermissionError("cache is unreadable")
        return original_read_text(path, *args, **kwargs)

    monkeypatch.setattr(Path, "read_text", raise_permission_error)
    client = RecordingEmbeddingClient()

    index = load_or_build_index(make_catalogue(), client, cache_path, "gemini-embedding-2", dimensions=2)

    assert len(index.entries) == 2
    assert len(client.calls) == 1


def test_search_ranks_by_similarity_then_entry_id() -> None:
    index = CatalogueIndex(
        entries=[
            IndexedEntry("tag", Tag(id="tag-b", name="Beta", slug="beta", description="B"), [1.0, 0.0]),
            IndexedEntry("tag", Tag(id="tag-a", name="Alpha", slug="alpha", description="A"), [1.0, 0.0]),
            IndexedEntry(
                "collection",
                Collection(id="collection-a", name="Collection", slug="collection", description="C", keywords=[]),
                [0.0, 1.0],
            ),
        ]
    )

    results = index.search([1.0, 0.0], "tag", limit=2)

    assert [result.entry.id for result in results] == ["tag-a", "tag-b"]
    assert [result.similarity for result in results] == [1.0, 1.0]
