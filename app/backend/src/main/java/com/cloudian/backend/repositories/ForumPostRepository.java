package com.cloudian.backend.repositories;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.cloudian.backend.models.ForumPost;

public interface ForumPostRepository extends JpaRepository<ForumPost, UUID> {

    /**
     * Bài công khai: đã duyệt, chưa xoá; lọc theo từ khoá trong tiêu đề và
     * theo một trong các chủ đề. topics là mảng Postgres dạng {"a","b"}, rỗng là {}.
     */
    @Query(value = """
            SELECT p.*
            FROM forum_post p
            WHERE CAST(p.status AS text) = 'APPROVED'
              AND p.deleted_at IS NULL
              AND (CAST(:keyword AS text) = ''
                   OR p.title ILIKE CONCAT('%', CAST(:keyword AS text), '%') ESCAPE '\\')
              AND (cardinality(CAST(:topics AS text[])) = 0
                   OR p.topics && CAST(:topics AS text[]))
            ORDER BY p.created_at DESC, p.id DESC
            """, countQuery = """
            SELECT count(*)
            FROM forum_post p
            WHERE CAST(p.status AS text) = 'APPROVED'
              AND p.deleted_at IS NULL
              AND (CAST(:keyword AS text) = ''
                   OR p.title ILIKE CONCAT('%', CAST(:keyword AS text), '%') ESCAPE '\\')
              AND (cardinality(CAST(:topics AS text[])) = 0
                   OR p.topics && CAST(:topics AS text[]))
            """, nativeQuery = true)
    Page<ForumPost> searchApproved(
            @Param("keyword") String keyword,
            @Param("topics") String topicsArray,
            Pageable pageable);

    /** Bài của tác giả, chưa xoá */
    Page<ForumPost> findByAuthor_IdAndDeletedAtIsNull(UUID authorUserId, Pageable pageable);

    /** Bài chưa xoá, nạp sẵn tác giả */
    @EntityGraph(attributePaths = "author")
    Optional<ForumPost> findByIdAndDeletedAtIsNull(UUID postId);
}
