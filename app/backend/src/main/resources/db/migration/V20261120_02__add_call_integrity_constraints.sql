BEGIN;

-- A server can have at most one active call session.
CREATE UNIQUE INDEX IF NOT EXISTS uq_call_session_active_server
    ON public.call_session (server_id)
    WHERE status = 'ACTIVE';

-- A user can have at most one active participation in a given call.
CREATE UNIQUE INDEX IF NOT EXISTS uq_call_participation_active
    ON public.call_participation (call_session_id, user_id)
    WHERE left_at IS NULL;

-- Keep the call lifecycle timestamps consistent with its status.
DO $migration$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_call_session_lifecycle'
          AND conrelid = 'public.call_session'::regclass
    ) THEN
        ALTER TABLE public.call_session
            ADD CONSTRAINT chk_call_session_lifecycle
            CHECK (
                (status = 'ACTIVE' AND ended_at IS NULL)
                OR
                (status = 'ENDED'
                    AND ended_at IS NOT NULL
                    AND ended_at >= started_at)
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_call_participation_time_order'
          AND conrelid = 'public.call_participation'::regclass
    ) THEN
        ALTER TABLE public.call_participation
            ADD CONSTRAINT chk_call_participation_time_order
            CHECK (left_at IS NULL OR left_at >= joined_at);
    END IF;
END
$migration$;

-- Helps load the event history for a call in chronological order.
CREATE INDEX IF NOT EXISTS idx_call_event_session_created_at
    ON public.call_event (call_session_id, created_at);

COMMIT;
