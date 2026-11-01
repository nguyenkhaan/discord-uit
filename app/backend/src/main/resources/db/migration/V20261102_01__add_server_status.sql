BEGIN;

ALTER TABLE server
    ADD COLUMN IF NOT EXISTS status VARCHAR(16);

UPDATE server
SET status = 'ACTIVE'
WHERE status IS NULL;

ALTER TABLE server
    ALTER COLUMN status SET DEFAULT 'ACTIVE';

ALTER TABLE server
    ALTER COLUMN status SET NOT NULL;

ALTER TABLE server
    DROP CONSTRAINT IF EXISTS server_status_valid;

ALTER TABLE server
    ADD CONSTRAINT server_status_valid
    CHECK (status IN ('ACTIVE', 'LOCKED', 'CLOSED'));

COMMIT;
