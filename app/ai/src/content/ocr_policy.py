import re


def needs_ocr(text: str, min_alnum_chars: int, min_alnum_ratio: float) -> bool:
    normalized = text.strip()
    if not normalized:
        return True
    alphanumeric_count = sum(character.isalnum() for character in normalized)
    return (
        alphanumeric_count < min_alnum_chars
        or alphanumeric_count / max(len(normalized), 1) < min_alnum_ratio
        or not re.search(r"\w", normalized)
    )
