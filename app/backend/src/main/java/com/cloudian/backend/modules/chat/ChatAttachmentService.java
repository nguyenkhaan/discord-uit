package com.cloudian.backend.modules.chat;

import java.util.Collection;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.cloudian.backend.commons.enums.MediaStatus;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.exceptions.StorageException;
import com.cloudian.backend.models.ChatMessageAttachment;
import com.cloudian.backend.models.Media;
import com.cloudian.backend.modules.chat.dto.ChatAttachmentResponse;
import com.cloudian.backend.repositories.ChatMessageAttachmentRepository;
import com.cloudian.backend.repositories.MediaRepository;
import com.cloudian.backend.repositories.UserAccountRepository;
import com.cloudian.backend.services.ImageUploadService;
import com.cloudian.backend.services.StorageService;

/** Upload ảnh chat, kiểm tra ảnh khi gửi tin, tạo link xem ảnh */
@Service
public class ChatAttachmentService {

    public static final int MAX_ATTACHMENTS = 5;

    private static final Logger LOGGER = LoggerFactory.getLogger(ChatAttachmentService.class);
    private static final String INVALID_ATTACHMENTS = "The attached images are not available.";
    private static final String DEFAULT_FILE_NAME = "image";
    private static final int MAX_FILE_NAME_LENGTH = 255;

    private final ImageUploadService imageUploadService;
    private final StorageService storageService;
    private final MediaRepository mediaRepository;
    private final ChatMessageAttachmentRepository attachmentRepository;
    private final UserAccountRepository userAccountRepository;

    public ChatAttachmentService(
            ImageUploadService imageUploadService,
            StorageService storageService,
            MediaRepository mediaRepository,
            ChatMessageAttachmentRepository attachmentRepository,
            UserAccountRepository userAccountRepository) {
        this.imageUploadService = imageUploadService;
        this.storageService = storageService;
        this.mediaRepository = mediaRepository;
        this.attachmentRepository = attachmentRepository;
        this.userAccountRepository = userAccountRepository;
    }

    /** Lưu ảnh vào MinIO và tạo media READY (chưa quét ảnh) */
    @Transactional
    public ChatAttachmentResponse upload(UUID serverId, UUID uploaderUserId, MultipartFile file) {
        String objectKey = imageUploadService.uploadImage(file, folderOf(serverId));

        Media media = new Media();
        media.setUploadedBy(userAccountRepository.getReferenceById(uploaderUserId));
        media.setFileName(safeFileName(file.getOriginalFilename()));
        media.setMimeType(mimeTypeOf(objectKey));
        media.setSizeBytes(Math.toIntExact(file.getSize()));
        media.setObjectKey(objectKey);
        media.setStatus(MediaStatus.READY);

        try {
            return toResponse(mediaRepository.saveAndFlush(media));
        } catch (RuntimeException exception) {
            // Không lưu được DB thì xoá file vừa upload
            storageService.delete(objectKey);
            throw exception;
        }
    }

    /** Ảnh gửi kèm phải do chính người gửi upload vào server này, READY và chưa gắn vào tin nào */
    @Transactional(readOnly = true)
    public List<Media> resolveForSend(UUID serverId, UUID senderUserId, List<UUID> mediaIds) {
        if (mediaIds.size() > MAX_ATTACHMENTS
                || new HashSet<>(mediaIds).size() != mediaIds.size()
                // List.of().contains(null) ném NPE nên dùng stream
                || mediaIds.stream().anyMatch(Objects::isNull)) {
            throw invalidAttachments();
        }

        Map<UUID, Media> found = mediaRepository.findAllById(mediaIds).stream()
                .collect(Collectors.toMap(Media::getId, Function.identity()));
        String folderPrefix = folderOf(serverId) + "/";

        List<Media> ordered = mediaIds.stream().map(found::get).toList();
        boolean allValid = ordered.stream().allMatch(media -> media != null
                && media.getUploadedBy().getId().equals(senderUserId)
                && media.getStatus() == MediaStatus.READY
                && media.getObjectKey().startsWith(folderPrefix));

        if (!allValid || attachmentRepository.existsById_MediaIdIn(mediaIds)) {
            throw invalidAttachments();
        }
        return ordered;
    }

    /** Ảnh của nhiều tin, theo thứ tự trong tin */
    @Transactional(readOnly = true)
    public Map<UUID, List<ChatAttachmentResponse>> findByMessageIds(Collection<UUID> messageIds) {
        if (messageIds.isEmpty()) {
            return Map.of();
        }
        return attachmentRepository.findWithMediaByMessageIds(messageIds).stream()
                .collect(Collectors.groupingBy(
                        attachment -> attachment.getId().getChatMessageId(),
                        LinkedHashMap::new,
                        Collectors.mapping(
                                (ChatMessageAttachment attachment) -> toResponse(attachment.getMedia()),
                                Collectors.toList())));
    }

    /** Ảnh của một tin */
    @Transactional(readOnly = true)
    public List<ChatAttachmentResponse> findByMessageId(UUID messageId) {
        return findByMessageIds(List.of(messageId)).getOrDefault(messageId, List.of());
    }

    private ChatAttachmentResponse toResponse(Media media) {
        return new ChatAttachmentResponse(
                media.getId(),
                viewUrl(media.getObjectKey()),
                media.getFileName(),
                media.getMimeType(),
                media.getSizeBytes());
    }

    /** Lỗi tạo link thì trả null, không làm hỏng cả trang chat */
    private String viewUrl(String objectKey) {
        try {
            return storageService.presignedGetUrl(objectKey);
        } catch (StorageException exception) {
            LOGGER.warn("Could not create the image link for {}", objectKey, exception);
            return null;
        }
    }

    private static String folderOf(UUID serverId) {
        return "chat/" + serverId;
    }

    /** ImageUploadService đặt đuôi file theo nội dung thật của ảnh */
    private static String mimeTypeOf(String objectKey) {
        if (objectKey.endsWith(".png")) {
            return "image/png";
        }
        if (objectKey.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    /** Bỏ đường dẫn, cắt tên quá dài */
    private static String safeFileName(String originalFileName) {
        if (originalFileName == null || originalFileName.isBlank()) {
            return DEFAULT_FILE_NAME;
        }
        String name = originalFileName.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1).strip();
        if (name.isEmpty()) {
            return DEFAULT_FILE_NAME;
        }
        return name.length() > MAX_FILE_NAME_LENGTH ? name.substring(0, MAX_FILE_NAME_LENGTH) : name;
    }

    private static ApiException invalidAttachments() {
        return new ApiException(HttpStatus.BAD_REQUEST, INVALID_ATTACHMENTS);
    }
}
