package com.cloudian.backend.models;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/** The same user keeps one public alias inside a thread, but aliases do not link threads. */
@Entity
@Table(name = "anonymous_alias", uniqueConstraints = {
        @UniqueConstraint(name = "uk_anonymous_alias_post_user", columnNames = {"forum_post_id", "user_id"}),
        @UniqueConstraint(name = "uk_anonymous_alias_post_alias", columnNames = {"forum_post_id", "display_alias"})
})
@Getter
@Setter
@NoArgsConstructor
public class AnonymousAlias {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "forum_post_id", nullable = false, updatable = false)
    private ForumPost forumPost;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private UserAccount user;

    @Column(name = "display_alias", nullable = false, updatable = false)
    private String displayAlias;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
