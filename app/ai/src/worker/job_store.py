from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine


@dataclass(frozen=True)
class Claim:
    should_process: bool
    topic: str | None = None
    payload: str | dict[str, Any] | list[Any] | None = None
    wait_seconds: float = 0
    attempt: int | None = None
    lease_until: datetime | None = None


class JobStore:
    def __init__(self, engine: AsyncEngine, lease_seconds: int) -> None:
        self._engine = engine
        self._lease_seconds = lease_seconds

    async def claim(self, run_id: str, attempt: int) -> Claim:
        now = datetime.now(timezone.utc)
        new_lease_until = now + timedelta(seconds=self._lease_seconds)

        async with self._engine.begin() as connection:
            inserted = await connection.execute(
                text("""
                    INSERT INTO classification_job (
                        classification_run_id, status, attempt, lease_until
                    )
                    VALUES (:run_id, 'PROCESSING', :attempt, :lease_until)
                    ON CONFLICT (classification_run_id) DO NOTHING
                    RETURNING classification_run_id
                """),
                {
                    "run_id": run_id,
                    "attempt": attempt,
                    "lease_until": new_lease_until,
                },
            )
            if inserted.scalar_one_or_none() is not None:
                return Claim(should_process=True, attempt=attempt, lease_until=new_lease_until)

            row = (
                await connection.execute(
                    text("""
                        SELECT status, attempt, lease_until, result_topic, result_payload
                        FROM classification_job
                        WHERE classification_run_id = :run_id
                        FOR UPDATE
                    """),
                    {"run_id": run_id},
                )
            ).mappings().one()

            if row["status"] == "RESULT_PENDING":
                return Claim(
                    should_process=False,
                    topic=row["result_topic"],
                    payload=row["result_payload"],
                    attempt=row["attempt"],
                )

            if row["status"] == "PROCESSING":
                current_lease_until = row["lease_until"]
                if current_lease_until is not None and current_lease_until > now:
                    return Claim(
                        should_process=False,
                        wait_seconds=max(0.1, (current_lease_until - now).total_seconds()),
                    )
                current_attempt = max(row["attempt"], attempt)
                await connection.execute(
                    text("""
                        UPDATE classification_job
                        SET attempt = :attempt, lease_until = :lease_until, updated_at = now()
                        WHERE classification_run_id = :run_id
                    """),
                    {
                        "run_id": run_id,
                        "attempt": current_attempt,
                        "lease_until": new_lease_until,
                    },
                )
                return Claim(
                    should_process=True,
                    attempt=current_attempt,
                    lease_until=new_lease_until,
                )

            if row["status"] == "PUBLISHED" and attempt > row["attempt"]:
                await connection.execute(
                    text("""
                        UPDATE classification_job
                        SET status = 'PROCESSING', attempt = :attempt,
                            lease_until = :lease_until, result_topic = NULL,
                            result_payload = NULL, completed_at = NULL, updated_at = now()
                        WHERE classification_run_id = :run_id
                    """),
                    {"run_id": run_id, "attempt": attempt, "lease_until": new_lease_until},
                )
                return Claim(should_process=True, attempt=attempt, lease_until=new_lease_until)

            # A published duplicate for this attempt is already complete.
            return Claim(should_process=False)

    async def save_result(
        self,
        run_id: str,
        topic: str,
        payload: str,
        lease_token: datetime,
    ) -> bool:
        async with self._engine.begin() as connection:
            result = await connection.execute(
                text("""
                    UPDATE classification_job
                    SET status = 'RESULT_PENDING',
                        result_topic = :topic,
                        result_payload = CAST(:payload AS jsonb),
                        lease_until = NULL,
                        updated_at = now()
                    WHERE classification_run_id = :run_id
                        AND status = 'PROCESSING'
                        AND lease_until = :lease_token
                        AND lease_until > now()
                    RETURNING classification_run_id
                """),
                {
                    "run_id": run_id,
                    "topic": topic,
                    "payload": payload,
                    "lease_token": lease_token,
                },
            )
            return result.scalar_one_or_none() is not None

    async def renew_lease(self, run_id: str, lease_token: datetime) -> datetime | None:
        new_lease_until = datetime.now(timezone.utc) + timedelta(seconds=self._lease_seconds)
        async with self._engine.begin() as connection:
            result = await connection.execute(
                text("""
                    UPDATE classification_job
                    SET lease_until = :new_lease_until, updated_at = now()
                    WHERE classification_run_id = :run_id
                        AND status = 'PROCESSING'
                        AND lease_until = :lease_token
                        AND lease_until > now()
                    RETURNING lease_until
                """),
                {
                    "run_id": run_id,
                    "lease_token": lease_token,
                    "new_lease_until": new_lease_until,
                },
            )
            return result.scalar_one_or_none()

    async def mark_published(self, run_id: str) -> None:
        async with self._engine.begin() as connection:
            await connection.execute(
                text("""
                    UPDATE classification_job
                    SET status = 'PUBLISHED',
                        lease_until = NULL,
                        completed_at = now(),
                        updated_at = now()
                    WHERE classification_run_id = :run_id AND status = 'RESULT_PENDING'
                """),
                {"run_id": run_id},
            )

