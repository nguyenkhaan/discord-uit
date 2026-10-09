package com.cloudian.backend.models;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import com.cloudian.backend.commons.enums.ForumPostStatus;
import com.cloudian.backend.commons.enums.ModerationRecommendation;

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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Forum topics are free-form search terms, not administrator-managed categories. */
@Entity
@Table(name = "forum_post")
@Getter
@Setter
@NoArgsConstructor
public class ForumPost {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_user_id", nullable = false, updatable = false)
    private UserAccount author;

    @Column(name = "title", nullable = false)
    private String title;

    /** Raw JSON document (e.g. rich-text editor output). Parse with Jackson in the service layer. */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "content", nullable = false, columnDefinition = "json")
    private String content;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "topics", columnDefinition = "text[]")
    private List<String> topics = new ArrayList<>();

    @Column(name = "is_anonymous", nullable = false, updatable = false)
    private boolean anonymous = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ForumPostStatus status = ForumPostStatus.PENDING_REVIEW;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_recommendation")
    private ModerationRecommendation aiRecommendation;

    /** Between 0 and 1 inclusive. */
    @Column(name = "ai_confidence")
    private Double aiConfidence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "moderated_by_user_id")
    private UserAccount moderatedBy;

    @Column(name = "moderated_at")
    private Instant moderatedAt;

    @Column(name = "moderation_reason")
    private String moderationReason;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;
}
