CREATE TABLE IF NOT EXISTS public.livekit_webhook_event (
    event_id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    room_name VARCHAR(255),
    participant_identity VARCHAR(255),
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_livekit_webhook_event_received_at
    ON public.livekit_webhook_event(received_at);