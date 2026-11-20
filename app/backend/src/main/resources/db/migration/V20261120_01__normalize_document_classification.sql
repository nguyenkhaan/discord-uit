BEGIN;

ALTER TABLE public.collection
    ADD COLUMN IF NOT EXISTS keywords text[] NOT NULL DEFAULT '{}'::text[];

CREATE TABLE IF NOT EXISTS public.tag (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    CONSTRAINT pk_tag PRIMARY KEY (id),
    CONSTRAINT uk_tag_slug UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS public.document_collection (
    document_id uuid NOT NULL,
    collection_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_document_collection
        PRIMARY KEY (document_id, collection_id),
    CONSTRAINT fk_document_collection_document
        FOREIGN KEY (document_id) REFERENCES public.document (id),
    CONSTRAINT fk_document_collection_collection
        FOREIGN KEY (collection_id) REFERENCES public.collection (id)
);

CREATE TABLE IF NOT EXISTS public.document_tag (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_document_tag PRIMARY KEY (id),
    CONSTRAINT uk_document_tag UNIQUE (document_id, tag_id),
    CONSTRAINT fk_document_tag_document
        FOREIGN KEY (document_id) REFERENCES public.document (id),
    CONSTRAINT fk_document_tag_tag
        FOREIGN KEY (tag_id) REFERENCES public.tag (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_document_collection_pair
    ON public.document_collection (document_id, collection_id);

-- Preserve existing document tags only; this migration does not seed the tag catalogue.
DO $migration$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'document'
          AND column_name = 'tags'
    ) THEN
        EXECUTE $backfill$
            WITH legacy_tags AS (
                SELECT
                    btrim(
                        lower(
                            regexp_replace(
                                trim(tag_value),
                                '[^a-zA-Z0-9]+',
                                '-',
                                'g'
                            )
                        ),
                        '-'
                    ) AS slug,
                    initcap(
                        regexp_replace(trim(tag_value), '[-_]+', ' ', 'g')
                    ) AS name
                FROM public.document AS d
                CROSS JOIN LATERAL unnest(
                    COALESCE(d.tags, ARRAY[]::text[])
                ) AS tag_values(tag_value)
                WHERE nullif(trim(tag_value), '') IS NOT NULL
            )
            INSERT INTO public.tag (id, name, slug, description)
            SELECT
                gen_random_uuid(),
                max(name),
                slug,
                'Migrated from document.tags'
            FROM legacy_tags
            WHERE slug <> ''
            GROUP BY slug
            ON CONFLICT (slug) DO NOTHING
        $backfill$;

        EXECUTE $backfill$
            WITH legacy_tags AS (
                SELECT
                    d.id AS document_id,
                    btrim(
                        lower(
                            regexp_replace(
                                trim(tag_value),
                                '[^a-zA-Z0-9]+',
                                '-',
                                'g'
                            )
                        ),
                        '-'
                    ) AS slug,
                    COALESCE(d.created_at, CURRENT_TIMESTAMP) AS created_at
                FROM public.document AS d
                CROSS JOIN LATERAL unnest(
                    COALESCE(d.tags, ARRAY[]::text[])
                ) AS tag_values(tag_value)
                WHERE nullif(trim(tag_value), '') IS NOT NULL
            )
            INSERT INTO public.document_tag (
                id,
                document_id,
                tag_id,
                created_at
            )
            SELECT
                gen_random_uuid(),
                legacy_tags.document_id,
                t.id,
                legacy_tags.created_at
            FROM legacy_tags
            JOIN public.tag AS t ON t.slug = legacy_tags.slug
            WHERE legacy_tags.slug <> ''
            ON CONFLICT (document_id, tag_id) DO NOTHING
        $backfill$;

        ALTER TABLE public.document
            DROP COLUMN tags;
    END IF;
END
$migration$;

DROP TABLE IF EXISTS public.agent_classification_category;
DROP TABLE IF EXISTS public.document_category;
DROP TABLE IF EXISTS public.collection_category;
DROP TABLE IF EXISTS public.category;

COMMIT;
