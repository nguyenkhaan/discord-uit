package com.cloudian.backend.models.ids;

import java.io.Serial;
import java.io.Serializable;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class PostReactionId implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Column(name = "forum_post_id", nullable = false, updatable = false)
    private UUID forumPostId;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;
}
