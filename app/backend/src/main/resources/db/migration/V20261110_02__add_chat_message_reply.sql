BEGIN;

-- Tin được trả lời (reply); NULL khi không reply
ALTER TABLE chat_message
    ADD COLUMN IF NOT EXISTS reply_to_message_id uuid NULL
        CONSTRAINT fk_chat_message_reply_to
        REFERENCES chat_message (id) ON DELETE SET NULL;

-- Không cho tin tự trả lời chính nó
ALTER TABLE chat_message
    DROP CONSTRAINT IF EXISTS chk_chat_message_not_self_reply;
ALTER TABLE chat_message
    ADD CONSTRAINT chk_chat_message_not_self_reply
        CHECK (reply_to_message_id IS NULL OR reply_to_message_id <> id);

CREATE INDEX IF NOT EXISTS idx_chat_message_reply_to
    ON chat_message (reply_to_message_id);

COMMIT;
