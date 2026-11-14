package com.cloudian.backend.repositories;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cloudian.backend.models.ChatMessageAttachment;
import com.cloudian.backend.models.ids.ChatMessageAttachmentId;

public interface ChatMessageAttachmentRepository
        extends JpaRepository<ChatMessageAttachment, ChatMessageAttachmentId> {

    /** Ảnh của nhiều tin trong 1 query, nạp sẵn media */
    @Query("""
            SELECT a
            FROM ChatMessageAttachment a
            JOIN FETCH a.media
            WHERE a.id.chatMessageId IN :messageIds
            ORDER BY a.id.chatMessageId, a.position
            """)
    List<ChatMessageAttachment> findWithMediaByMessageIds(
            @Param("messageIds") Collection<UUID> messageIds);

    /** Ảnh đã gắn vào tin nào đó chưa */
    boolean existsById_MediaIdIn(Collection<UUID> mediaIds);
}
