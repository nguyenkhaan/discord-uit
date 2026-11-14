package com.cloudian.backend.models;

import com.cloudian.backend.models.ids.ChatMessageAttachmentId;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Ảnh đính kèm của tin nhắn, position là thứ tự ảnh trong tin */
@Entity
@Table(name = "chat_message_attachment")
@Getter
@Setter
@NoArgsConstructor
public class ChatMessageAttachment {

    @EmbeddedId
    private ChatMessageAttachmentId id = new ChatMessageAttachmentId();

    @MapsId("chatMessageId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chat_message_id", nullable = false, updatable = false)
    private ChatMessage message;

    @MapsId("mediaId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "media_id", nullable = false, updatable = false)
    private Media media;

    @Column(name = "position", nullable = false, updatable = false)
    private short position;
}
