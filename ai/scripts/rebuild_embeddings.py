# uv run python scripts/rebuild_embeddings.py --force
"""Build or refresh the local Gemini embedding cache for the catalogue."""

import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.config.settings import get_settings
from src.harness.gemini_embeddings import GeminiEmbeddingClient
from src.service.catalogue import load_catalogue
from src.service.catalogue_cache import load_or_build_index


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the catalogue embedding cache.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="discard the current catalogue cache before rebuilding every entry",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    settings = get_settings()
    api_key = settings.gemini_api_key
    if api_key is None:
        raise SystemExit("GEMINI_API_KEY is required in .env")

    cache_path = settings.cache_path
    if args.force:
        cache_path.unlink(missing_ok=True)

    catalogue = load_catalogue(Path("data/data.json"))
    client = GeminiEmbeddingClient(api_key.get_secret_value(), settings.gemini_embedding_model)
    index = load_or_build_index(
        catalogue,
        client,
        cache_path,
        settings.gemini_embedding_model,
        settings.gemini_embedding_dimensions,
    )
    print(
        f"Indexed {len(index.entries)} catalogue entries "
        f"({len(catalogue.tags)} tags, {len(catalogue.collections)} collections) at {cache_path}"
    )


if __name__ == "__main__":
    main()
