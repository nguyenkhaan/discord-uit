import unittest

from src.config.setting import Settings


class SettingsTests(unittest.TestCase):
    def test_empty_optional_database_url_is_treated_as_unconfigured(self) -> None:
        settings = Settings(_env_file=None, database_url="")

        self.assertIsNone(settings.database_url)
