package com.cloudian.backend.models;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;

import com.cloudian.backend.commons.enums.MessageLinkType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * linked_content_type and linked_content_id must either both be null or both be present.
 * linked_content_id is polymorphic (document or forum_post), so it is a plain UUID, not a FK.
 */
@Entity
@Table(name = "chat_message", uniqueConstraints = @UniqueConstraint(
        name = "uk_chat_message_server_sender_request",
        columnNames = {"server_id", "sender_user_id", "client_request_id"}))
@Getter
@Setter
@NoArgsConstructor
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "server_id", nullable = false, updatable = false)
    private Server server;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "sender_user_id", nullable = false, updatable = false)
    private UserAccount sender;

    @Column(name = "content_text")
    private String contentText;

    @Column(name = "client_request_id", nullable = false, updatable = false)
    private String clientRequestId;

    @Enumerated(EnumType.STRING)
    @Column(name = "linked_content_type", updatable = false)
    private MessageLinkType linkedContentType;

    @Column(name = "linked_content_id", updatable = false)
    private UUID linkedContentId;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "edited_at")
    private Instant editedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deleted_by_user_id")
    private UserAccount deletedBy;

    @Column(name = "deletion_reason")
    private String deletionReason;

    /** At most 90 days after deletion. */
    @Column(name = "purge_at")
    private Instant purgeAt;
}
