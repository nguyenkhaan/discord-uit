BEGIN;

CREATE TABLE IF NOT EXISTS public.classification_job (
    classification_run_id varchar(128) PRIMARY KEY,
    status varchar(32) NOT NULL,
    attempt integer NOT NULL,
    lease_until timestamptz,
    result_topic varchar(255),
    result_payload jsonb,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamptz,
    CONSTRAINT chk_classification_job_status
        CHECK (status IN ('PROCESSING', 'RESULT_PENDING', 'PUBLISHED')),
    CONSTRAINT chk_classification_job_attempt
        CHECK (attempt >= 1)
);

CREATE INDEX IF NOT EXISTS idx_classification_job_status_lease
    ON public.classification_job (status, lease_until);

COMMIT;
