from data.contract import Collection, Tag
import pytest
from src.service.catalogue_cache import CatalogueIndex, EmbeddingClient, IndexedEntry
from src.service.extraction import ExtractedDocument
from src.service.retrieval import retrieve_candidates


class FakeEmbeddingClient(EmbeddingClient):
    def __init__(self, vectors: dict[str, list[float]]) -> None:
        self.vectors = vectors
        self.calls: list[list[str]] = []

    def embed(self, texts: list[str]) -> list[list[float]]:
        self.calls.append(texts)
        return [self.vectors[text] for text in texts]


def test_retrieval_uses_each_entrys_strongest_chunk_similarity() -> None:
    index = CatalogueIndex(
        entries=[
            IndexedEntry("tag", Tag(id="tag-physics", name="Physics", slug="physics", description="P"), [0.9, 0.435889894]),
            IndexedEntry("tag", Tag(id="tag-biology", name="Biology", slug="biology", description="B"), [0.7, 0.714142843]),
            IndexedEntry(
                "collection",
                Collection(id="collection-science", name="Science", slug="science", description="S", keywords=[]),
                [1.0, 0.0],
            ),
        ]
    )
    client = FakeEmbeddingClient({"physics": [1.0, 0.0], "biology": [0.0, 1.0]})

    result = retrieve_candidates(
        ExtractedDocument(filename="notes.txt", text="physicsbiology"),
        index,
        client,
        chunk_size=7,
        max_chunks=2,
    )

    assert [item.entry.id for item in result.tags] == ["tag-physics", "tag-biology"]
    assert [item.similarity for item in result.tags] == pytest.approx([0.9, 0.714142843])
    assert result.collections[0].entry.id == "collection-science"
    assert result.was_truncated is False


def test_retrieval_applies_tag_and_collection_limits() -> None:
    entries = [
        IndexedEntry("tag", Tag(id=f"tag-{number:02}", name="Tag", slug=f"tag-{number:02}", description="D"), [1.0, 0.0])
        for number in range(9)
    ]
    entries.extend(
        IndexedEntry(
            "collection",
            Collection(id=f"collection-{number:02}", name="Collection", slug=f"collection-{number:02}", description="D", keywords=[]),
            [1.0, 0.0],
        )
        for number in range(6)
    )
    client = FakeEmbeddingClient({"subject": [1.0, 0.0]})

    result = retrieve_candidates(ExtractedDocument(filename="notes.txt", text="subject"), CatalogueIndex(entries), client)

    assert len(result.tags) == 8
    assert len(result.collections) == 5
    assert result.tags[-1].entry.id == "tag-07"
    assert result.collections[-1].entry.id == "collection-04"


def test_retrieval_marks_long_documents_as_truncated() -> None:
    index = CatalogueIndex(
        entries=[IndexedEntry("tag", Tag(id="tag-a", name="A", slug="a", description="A"), [1.0, 0.0])]
    )
    client = FakeEmbeddingClient({"abcde": [1.0, 0.0], "fghij": [1.0, 0.0]})

    result = retrieve_candidates(
        ExtractedDocument(filename="long.txt", text="abcdefghijklmno"),
        index,
        client,
        chunk_size=5,
        max_chunks=2,
    )

    assert result.was_truncated is True
    assert client.calls == [["abcde", "fghij"]]
