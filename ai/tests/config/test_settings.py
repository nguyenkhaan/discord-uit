import pytest
from pydantic import ValidationError

from src.config.settings import Settings


def test_default_port_is_5050(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("PORT", raising=False)

    assert Settings(_env_file=None).port == 5050


def test_invalid_port_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("PORT", "not-a-port")

    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_port_loads_from_dotenv(tmp_path) -> None:
    env_file = tmp_path / ".env"
    env_file.write_text("PORT=6060\n", encoding="utf-8")

    assert Settings(_env_file=env_file).port == 6060
