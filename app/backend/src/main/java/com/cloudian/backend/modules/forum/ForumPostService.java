package com.cloudian.backend.modules.forum;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.commons.enums.ForumPostStatus;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.ForumPost;
import com.cloudian.backend.models.UserAccount;
import com.cloudian.backend.modules.forum.dto.CreateForumPostRequest;
import com.cloudian.backend.modules.forum.dto.ForumPostListRequest;
import com.cloudian.backend.modules.forum.dto.ForumPostPageResponse;
import com.cloudian.backend.modules.forum.dto.ForumPostResponse;
import com.cloudian.backend.modules.forum.dto.ForumPostSummaryResponse;
import com.cloudian.backend.modules.forum.dto.MyForumPostPageResponse;
import com.cloudian.backend.modules.forum.dto.MyForumPostResponse;
import com.cloudian.backend.modules.forum.dto.UpdateForumPostRequest;
import com.cloudian.backend.repositories.ForumPostRepository;
import com.cloudian.backend.repositories.UserAccountRepository;

import lombok.RequiredArgsConstructor;

/** Đăng, sửa, xoá bài và đọc bài công khai / bài của tôi */
@Service
@RequiredArgsConstructor
public class ForumPostService {

    /** Tên hiển thị thay cho tác giả của bài ẩn danh */
    public static final String ANONYMOUS_NAME = "Ẩn danh";

    private static final String POST_NOT_FOUND = "Post not found.";
    private static final String POST_REMOVED = "Removed posts cannot be edited.";

    private final ForumPostRepository postRepository;
    private final UserAccountRepository userAccountRepository;

    /** Bài mới luôn chờ duyệt */
    @Transactional
    public ForumPostResponse create(UUID authorUserId, CreateForumPostRequest request) {
        ForumPost post = new ForumPost();
        post.setAuthor(userAccountRepository.getReferenceById(authorUserId));
        post.setTitle(normalizeTitle(request.title()));
        ForumContent.validate(request.content());
        post.setContent(request.content());
        post.setTopics(ForumTopicNormalizer.normalizeForWrite(request.topics()));
        post.setAnonymous(Boolean.TRUE.equals(request.anonymous()));
        post.setStatus(ForumPostStatus.PENDING_REVIEW);

        ForumPost saved = postRepository.saveAndFlush(post);
        return toDetail(saved, authorUserId, authorName(saved));
    }

    /** Chỉ tác giả sửa; sửa xong quay lại chờ duyệt và ẩn khỏi trang công khai */
    @Transactional
    public ForumPostResponse update(UUID postId, UUID currentUserId, UpdateForumPostRequest request) {
        ForumPost post = findOwnPost(postId, currentUserId);
        if (post.getStatus() == ForumPostStatus.REMOVED) {
            throw new ApiException(HttpStatus.CONFLICT, POST_REMOVED);
        }
        post.setTitle(normalizeTitle(request.title()));
        ForumContent.validate(request.content());
        post.setContent(request.content());
        post.setTopics(ForumTopicNormalizer.normalizeForWrite(request.topics()));
        resetReview(post);

        ForumPost saved = postRepository.saveAndFlush(post);
        return toDetail(saved, currentUserId, authorName(saved));
    }

    /** Chỉ tác giả xoá; xoá mềm */
    @Transactional
    public void delete(UUID postId, UUID currentUserId) {
        ForumPost post = findOwnPost(postId, currentUserId);
        post.setDeletedAt(Instant.now());
    }

    /** Bài đã duyệt; tác giả xem được cả bài chưa duyệt của mình */
    @Transactional(readOnly = true)
    public ForumPostResponse get(UUID postId, UUID currentUserId) {
        ForumPost post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(ForumPostService::notFound);
        boolean mine = isAuthor(post, currentUserId);
        if (!mine && post.getStatus() != ForumPostStatus.APPROVED) {
            throw notFound();
        }
        return toDetail(post, currentUserId, authorName(post));
    }

    /** Danh sách công khai, mới nhất trước */
    @Transactional(readOnly = true)
    public ForumPostPageResponse search(UUID currentUserId, ForumPostListRequest request) {
        List<String> topics = ForumTopicNormalizer.normalizeForSearch(request.topics());
        Page<ForumPost> page = postRepository.searchApproved(
                escapeLike(request.q()),
                ForumTopicNormalizer.toPostgresArray(topics),
                PageRequest.of(request.page(), request.size()));

        Map<UUID, String> names = authorNames(page.getContent());
        List<ForumPostSummaryResponse> items = page.getContent().stream()
                .map(post -> new ForumPostSummaryResponse(
                        post.getId(),
                        post.getTitle(),
                        ForumContent.excerpt(post.getContent()),
                        post.getTopics(),
                        post.isAnonymous(),
                        post.isAnonymous() ? ANONYMOUS_NAME : names.get(post.getAuthor().getId()),
                        isAuthor(post, currentUserId),
                        post.getCreatedAt()))
                .toList();

        return new ForumPostPageResponse(
                items, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    /** Bài của tôi ở mọi trạng thái, sửa gần nhất trước */
    @Transactional(readOnly = true)
    public MyForumPostPageResponse listMine(UUID currentUserId, ForumPostListRequest request) {
        Page<ForumPost> page = postRepository.findByAuthor_IdAndDeletedAtIsNull(
                currentUserId,
                PageRequest.of(
                        request.page(),
                        request.size(),
                        Sort.by(Sort.Order.desc("updatedAt"), Sort.Order.desc("id"))));

        List<MyForumPostResponse> items = page.getContent().stream()
                .map(post -> new MyForumPostResponse(
                        post.getId(),
                        post.getTitle(),
                        ForumContent.excerpt(post.getContent()),
                        post.getTopics(),
                        post.isAnonymous(),
                        post.getStatus(),
                        post.getModerationReason(),
                        post.getCreatedAt(),
                        post.getUpdatedAt()))
                .toList();

        return new MyForumPostPageResponse(
                items, page.getNumber(), page.getSize(), page.getTotalElements(), page.getTotalPages());
    }

    private ForumPost findOwnPost(UUID postId, UUID currentUserId) {
        ForumPost post = postRepository.findByIdAndDeletedAtIsNull(postId)
                .orElseThrow(ForumPostService::notFound);
        // Không phải tác giả thì báo không tìm thấy, tránh lộ bài chưa duyệt
        if (!isAuthor(post, currentUserId)) {
            throw notFound();
        }
        return post;
    }

    /** Nội dung mới cần duyệt lại; bỏ kết quả duyệt và đề xuất AI cũ */
    private static void resetReview(ForumPost post) {
        post.setStatus(ForumPostStatus.PENDING_REVIEW);
        post.setAiRecommendation(null);
        post.setAiConfidence(null);
        post.setModeratedBy(null);
        post.setModeratedAt(null);
        post.setModerationReason(null);
    }

    private static ForumPostResponse toDetail(ForumPost post, UUID currentUserId, String authorName) {
        boolean mine = isAuthor(post, currentUserId);
        return new ForumPostResponse(
                post.getId(),
                post.getTitle(),
                post.getContent(),
                post.getTopics(),
                post.isAnonymous(),
                authorName,
                mine,
                mine ? post.getStatus() : null,
                mine ? post.getModerationReason() : null,
                post.getCreatedAt(),
                post.getUpdatedAt());
    }

    /** Bài ẩn danh không bao giờ trả tên thật */
    private String authorName(ForumPost post) {
        if (post.isAnonymous()) {
            return ANONYMOUS_NAME;
        }
        return userAccountRepository.findById(post.getAuthor().getId())
                .map(UserAccount::getFullName)
                .orElse(null);
    }

    /** Lấy tên tác giả của cả trang trong 1 query */
    private Map<UUID, String> authorNames(List<ForumPost> posts) {
        Set<UUID> authorIds = posts.stream()
                .filter(post -> !post.isAnonymous())
                .map(post -> post.getAuthor().getId())
                .collect(Collectors.toSet());
        if (authorIds.isEmpty()) {
            return Map.of();
        }
        return userAccountRepository.findAllById(authorIds).stream()
                .collect(Collectors.toMap(UserAccount::getId, user -> nullToEmpty(user.getFullName()), (a, b) -> a));
    }

    private static boolean isAuthor(ForumPost post, UUID currentUserId) {
        return currentUserId != null && currentUserId.equals(post.getAuthor().getId());
    }

    private static String normalizeTitle(String title) {
        String value = title == null ? "" : title.strip().replaceAll("\\s+", " ");
        if (value.isEmpty() || value.length() > 200) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid post title.");
        }
        return value;
    }

    /** Escape ký tự đặc biệt của LIKE */
    private static String escapeLike(String keyword) {
        return keyword.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static ApiException notFound() {
        return new ApiException(HttpStatus.NOT_FOUND, POST_NOT_FOUND);
    }
}
