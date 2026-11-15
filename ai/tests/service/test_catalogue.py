import json
from pathlib import Path

import pytest

from data.contract import Catalogue, Collection, Tag
from src.service.catalogue import CatalogueLoadError, canonical_text, load_catalogue


def write_catalogue(path: Path, payload: dict[str, object]) -> Path:
    path.write_text(json.dumps(payload), encoding="utf-8")
    return path


def test_load_catalogue_accepts_mixed_language_entries(tmp_path: Path) -> None:
    path = write_catalogue(
        tmp_path / "data.json",
        {
            "tags": [
                {
                    "id": "tag-research",
                    "name": "Research",
                    "slug": "research",
                    "description": "Research material",
                }
            ],
            "collections": [
                {
                    "id": "collection-tai-lieu",
                    "name": "Tài liệu nghiên cứu",
                    "slug": "tai-lieu-nghien-cuu",
                    "description": "Vietnamese and English research documents",
                    "keywords": ["paper", "nghiên cứu"],
                }
            ],
        },
    )

    catalogue = load_catalogue(path)

    assert catalogue.tags[0].name == "Research"
    assert catalogue.collections[0].name == "Tài liệu nghiên cứu"


def test_canonical_text_includes_all_searchable_fields() -> None:
    tag = Tag(id="tag-report", name="Report", slug="report", description="Quarterly update")
    collection = Collection(
        id="collection-finance",
        name="Finance",
        slug="finance",
        description="Financial records",
        keywords=["budget", "invoice"],
    )

    assert canonical_text(tag) == "Report\nreport\nQuarterly update"
    assert canonical_text(collection) == "Finance\nfinance\nFinancial records\nbudget\ninvoice"


@pytest.mark.parametrize(
    "payload",
    [
        {
            "tags": [
                {"id": "same", "name": "First", "slug": "first", "description": "One"},
                {"id": "same", "name": "Second", "slug": "second", "description": "Two"},
            ],
            "collections": [],
        },
        {
            "tags": [],
            "collections": [
                {
                    "id": "one",
                    "name": "First",
                    "slug": "same-slug",
                    "description": "One",
                    "keywords": [],
                },
                {
                    "id": "two",
                    "name": "Second",
                    "slug": "same-slug",
                    "description": "Two",
                    "keywords": [],
                },
            ],
        },
    ],
)
def test_load_catalogue_rejects_duplicate_ids_or_slugs(tmp_path: Path, payload: dict[str, object]) -> None:
    with pytest.raises(CatalogueLoadError, match="duplicate"):
        load_catalogue(write_catalogue(tmp_path / "data.json", payload))


def test_load_catalogue_rejects_malformed_json(tmp_path: Path) -> None:
    path = tmp_path / "data.json"
    path.write_text("{not json", encoding="utf-8")

    with pytest.raises(CatalogueLoadError, match="valid JSON"):
        load_catalogue(path)
