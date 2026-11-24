BEGIN;

ALTER TABLE public.media
    ADD COLUMN IF NOT EXISTS verified_etag varchar(128);

CREATE TABLE IF NOT EXISTS public.classification_run (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    classification_run_id varchar(128) NOT NULL,
    document_submission_id uuid NOT NULL,
    media_id uuid NOT NULL,
    status varchar(32) NOT NULL DEFAULT 'QUEUED',
    attempt_count integer NOT NULL DEFAULT 0,
    failure_code varchar(128),
    failure_message text,
    model_id varchar(255),
    ocr_needed boolean NOT NULL DEFAULT false,
    queued_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_classification_run PRIMARY KEY (id),
    CONSTRAINT uk_classification_run_business_id UNIQUE (classification_run_id),
    CONSTRAINT uk_classification_run_submission UNIQUE (document_submission_id),
    CONSTRAINT fk_classification_run_submission
        FOREIGN KEY (document_submission_id)
        REFERENCES public.document_submission (id),
    CONSTRAINT fk_classification_run_media
        FOREIGN KEY (media_id)
        REFERENCES public.media (id),
    CONSTRAINT chk_classification_run_attempt_count
        CHECK (attempt_count >= 0),
    CONSTRAINT chk_classification_run_status
        CHECK (status IN ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'DEAD_LETTER'))
);

CREATE INDEX IF NOT EXISTS idx_classification_run_media
    ON public.classification_run (media_id);

CREATE INDEX IF NOT EXISTS idx_classification_run_status
    ON public.classification_run (status);

COMMIT;
