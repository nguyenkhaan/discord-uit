import json
from pathlib import Path

from pydantic import ValidationError

from data.contract import Catalogue, CatalogueEntry, Collection


class CatalogueLoadError(ValueError):
    pass


def load_catalogue(path: Path) -> Catalogue:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise CatalogueLoadError(f"catalogue file does not exist: {path}") from error
    except UnicodeDecodeError as error:
        raise CatalogueLoadError("catalogue must be UTF-8 encoded") from error
    except json.JSONDecodeError as error:
        raise CatalogueLoadError("catalogue must contain valid JSON") from error

    try:
        return Catalogue.model_validate(payload)
    except ValidationError as error:
        raise CatalogueLoadError(f"invalid catalogue: {error}") from error


def canonical_text(entry: CatalogueEntry) -> str:
    fields = [entry.name, entry.slug, entry.description]
    if isinstance(entry, Collection):
        fields.extend(entry.keywords)
    return "\n".join(fields)
