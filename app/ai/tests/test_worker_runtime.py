import unittest

from sqlalchemy import make_url

from src.config.setting import Settings
from src.worker.runtime import ClassificationWorker, _async_database_url


class ClassificationWorkerConstructionTests(unittest.TestCase):
    def test_worker_can_be_constructed_before_an_event_loop_starts(self) -> None:
        worker = ClassificationWorker(
            settings=Settings(
                _env_file=None,
                database_url="postgresql+asyncpg://worker:worker@127.0.0.1:5432/worker"
            )
        )

        self.assertFalse(worker.is_ready)

    def test_worker_converts_sync_driver_and_sslmode_for_asyncpg(self) -> None:
        url = _async_database_url(
            "postgresql+psycopg2://worker:password@db.internal:5432/worker?sslmode=require&pgbouncer=true"
        )
        parsed = make_url(url)

        self.assertEqual(parsed.drivername, "postgresql+asyncpg")
        self.assertEqual(parsed.query["ssl"], "require")
        self.assertEqual(parsed.query["prepared_statement_cache_size"], "0")
        self.assertNotIn("sslmode", parsed.query)
        self.assertNotIn("pgbouncer", parsed.query)

