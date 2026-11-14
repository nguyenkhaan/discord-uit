
package com.cloudian.backend.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cloudian.backend.models.MessageReaction;
import com.cloudian.backend.models.ids.MessageReactionId;

public interface MessageReactionRepository
        extends JpaRepository<MessageReaction, MessageReactionId> {

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            INSERT INTO message_reaction (
                message_id,
                reacted_by_user_id,
                icon_id,
                created_at
            )
            VALUES (
                :messageId,
                :userId,
                :iconId,
                CURRENT_TIMESTAMP
            )
            ON CONFLICT (message_id, reacted_by_user_id)
            DO UPDATE SET
                icon_id = EXCLUDED.icon_id,
                created_at = CURRENT_TIMESTAMP
            WHERE message_reaction.icon_id
                  IS DISTINCT FROM EXCLUDED.icon_id
            """, nativeQuery = true)
    int upsertReaction(
            @Param("messageId") UUID messageId,
            @Param("userId") UUID userId,
            @Param("iconId") UUID iconId);

    @Modifying
    @Query("""
            DELETE FROM MessageReaction r
            WHERE r.id.messageId = :messageId
              AND r.id.reactedByUserId = :userId
            """)
    int deleteReaction(
            @Param("messageId") UUID messageId,
            @Param("userId") UUID userId);

    @Query("""
            SELECT
                r.icon.id AS iconId,
                r.icon.iconImage AS iconImage,
                r.icon.name AS name,
                COUNT(r) AS reactionCount,
                SUM(
                    CASE
                        WHEN r.reactedBy.id = :userId THEN 1
                        ELSE 0
                    END
                ) AS currentUserReactionCount
            FROM MessageReaction r
            WHERE r.message.id = :messageId
            GROUP BY
                r.icon.id,
                r.icon.iconImage,
                r.icon.name
            ORDER BY r.icon.name ASC
            """)
    List<ReactionAggregate> findAggregatesByMessageIdAndUserId(
            @Param("messageId") UUID messageId,
            @Param("userId") UUID userId);

    interface ReactionAggregate {

        UUID getIconId();

        String getIconImage();

        String getName();

        Long getReactionCount();

        Long getCurrentUserReactionCount();
    }
}
