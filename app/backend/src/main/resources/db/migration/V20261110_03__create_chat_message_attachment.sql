BEGIN;

-- Ảnh đính kèm của tin nhắn; file ảnh lưu ở bảng media
CREATE TABLE IF NOT EXISTS chat_message_attachment (
    chat_message_id uuid     NOT NULL,
    media_id        uuid     NOT NULL,
    position        smallint NOT NULL,
    CONSTRAINT pk_chat_message_attachment
        PRIMARY KEY (chat_message_id, media_id),
    CONSTRAINT fk_chat_message_attachment_message
        FOREIGN KEY (chat_message_id) REFERENCES chat_message (id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_message_attachment_media
        FOREIGN KEY (media_id) REFERENCES media (id),
    -- Thứ tự ảnh trong tin, không trùng
    CONSTRAINT uq_chat_message_attachment_position
        UNIQUE (chat_message_id, position),
    CONSTRAINT chk_chat_message_attachment_position
        CHECK (position >= 0)
);

CREATE INDEX IF NOT EXISTS idx_chat_message_attachment_media
    ON chat_message_attachment (media_id);

COMMIT;
