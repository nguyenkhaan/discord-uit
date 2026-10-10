package com.cloudian.backend.models;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import com.cloudian.backend.commons.enums.ReactionType;
import com.cloudian.backend.models.ids.PostReactionId;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "post_reaction")
@Getter
@Setter
@NoArgsConstructor
public class PostReaction {

    @EmbeddedId
    private PostReactionId id = new PostReactionId();

    @MapsId("forumPostId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "forum_post_id", nullable = false, updatable = false)
    private ForumPost forumPost;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private UserAccount user;

    @Enumerated(EnumType.STRING)
    @Column(name = "reaction", nullable = false)
    private ReactionType reaction;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
