BEGIN;

ALTER TABLE public.agent_classification_collection
    DROP CONSTRAINT IF EXISTS chk_agent_classification_collection_confidence;

ALTER TABLE public.agent_classification_collection
    ADD CONSTRAINT chk_agent_classification_collection_confidence
    CHECK (confidence >= 0 AND confidence <= 1);

CREATE TABLE IF NOT EXISTS public.agent_classification_tag (
    agent_classification_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    confidence double precision NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_agent_classification_tag
        PRIMARY KEY (agent_classification_id, tag_id),
    CONSTRAINT fk_agent_classification_tag_classification
        FOREIGN KEY (agent_classification_id)
        REFERENCES public.agent_classification (id),
    CONSTRAINT fk_agent_classification_tag_tag
        FOREIGN KEY (tag_id) REFERENCES public.tag (id),
    CONSTRAINT chk_agent_classification_tag_confidence
        CHECK (confidence >= 0 AND confidence <= 1)
);

COMMIT;
