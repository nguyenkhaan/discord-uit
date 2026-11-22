package com.cloudian.backend.modules.document;

import java.io.IOException;
import java.io.InputStream;
import java.text.Normalizer;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import com.cloudian.backend.commons.enums.DocumentSubmissionStatus;
import com.cloudian.backend.commons.enums.DocumentVisibilityStatus;
import com.cloudian.backend.commons.enums.MediaStatus;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.exceptions.StorageException;
import com.cloudian.backend.models.Document;
import com.cloudian.backend.models.DocumentSubmission;
import com.cloudian.backend.models.DocumentTag;
import com.cloudian.backend.models.Media;
import com.cloudian.backend.models.Tag;
import com.cloudian.backend.modules.document.dto.DocumentPreviewResponse;
import com.cloudian.backend.modules.document.dto.DocumentReviewDecision;
import com.cloudian.backend.modules.document.dto.DocumentReviewRequest;
import com.cloudian.backend.modules.document.dto.DocumentSubmissionResponse;
import com.cloudian.backend.modules.document.dto.DocumentUploadInitRequest;
import com.cloudian.backend.modules.document.dto.DocumentUploadInitResponse;
import com.cloudian.backend.modules.document.dto.DocumentUploadResponse;
import com.cloudian.backend.modules.document.dto.UploadDocumentRequest;
import com.cloudian.backend.repositories.DocumentTagRepository;
import com.cloudian.backend.repositories.DocumentRepository;
import com.cloudian.backend.repositories.DocumentSubmissionRepository;
import com.cloudian.backend.repositories.MediaRepository;
import com.cloudian.backend.repositories.TagRepository;
import com.cloudian.backend.repositories.UserAccountRepository;
import com.cloudian.backend.services.StorageService;
import com.cloudian.backend.services.StorageService.StorageObjectMetadata;

@Service
public class DocumentService {

    private static final String DOCUMENT_FOLDER = "documents";
    private static final String EMPTY_FILE_MESSAGE = "Please choose a document.";
    private static final String INVALID_TITLE_MESSAGE = "Document title is required.";
    private static final String INVALID_EXTENSION_MESSAGE = "This document extension is not allowed.";
    private static final String INVALID_SLUG_MESSAGE =
            "Slug must contain only lowercase letters, numbers and single hyphens.";
    private static final String DUPLICATE_SLUG_MESSAGE = "Document slug already exists.";
    private static final String FILE_READ_MESSAGE = "Could not read the uploaded document.";
    private static final Pattern SLUG_PATTERN = Pattern.compile("[a-z0-9]+(?:-[a-z0-9]+)*");

    private final StorageService storageService;
    private final MediaRepository mediaRepository;
    private final DocumentRepository documentRepository;
    private final DocumentSubmissionRepository submissionRepository;
    private final UserAccountRepository userAccountRepository;
    private final TagRepository tagRepository;
    private final DocumentTagRepository documentTagRepository;
    private final Set<String> allowedExtensions;
    private final long maxUploadSizeBytes;

    public DocumentService(
            StorageService storageService,
            MediaRepository mediaRepository,
            DocumentRepository documentRepository,
            DocumentSubmissionRepository submissionRepository,
            UserAccountRepository userAccountRepository,
            TagRepository tagRepository,
            DocumentTagRepository documentTagRepository,
            @Value("${app.agent.classfication.allowed:pdf,docx,pptx,txt}") String allowedExtensions,
            @Value("${app.storage.max-upload-size-bytes:5242880}") long maxUploadSizeBytes) {
        this.storageService = storageService;
        this.mediaRepository = mediaRepository;
        this.documentRepository = documentRepository;
        this.submissionRepository = submissionRepository;
        this.userAccountRepository = userAccountRepository;
        this.tagRepository = tagRepository;
        this.documentTagRepository = documentTagRepository;
        this.allowedExtensions = parseAllowedExtensions(allowedExtensions);
        this.maxUploadSizeBytes = maxUploadSizeBytes;
    }

    @Transactional
    public DocumentUploadInitResponse initUpload(UUID uploaderUserId, DocumentUploadInitRequest request) {
        if (request == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Upload metadata is required.");
        }

        String title = normalizeTitle(request.title());
        String description = normalizeDescription(request.description());
        String fileName = safeFileName(request.fileName());
        String extension = extensionOf(fileName);
        validateExtension(extension);

        long sizeBytes = request.sizeBytes() == null ? 0 : request.sizeBytes();
        if (sizeBytes <= 0 || sizeBytes > maxUploadSizeBytes || sizeBytes > Integer.MAX_VALUE) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "The document size must be between 1 byte and " + maxUploadSizeBytes + " bytes.");
        }

        String declaredMimeType = normalizeMimeType(request.mimeType());
        String expectedMimeType = mimeTypeOf(extension);
        if (!expectedMimeType.equals(declaredMimeType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The declared MIME type does not match the file extension.");
        }

        String slug = resolveSlug(title, request.slug());
        String objectKey = DOCUMENT_FOLDER + "/" + UUID.randomUUID() + "." + extension;
        var uploader = userAccountRepository.getReferenceById(uploaderUserId);

        Media media = new Media();
        media.setUploadedBy(uploader);
        media.setFileName(fileName);
        media.setMimeType(declaredMimeType);
        media.setSizeBytes(Math.toIntExact(sizeBytes));
        media.setObjectKey(objectKey);
        media.setStatus(MediaStatus.QUARANTINED);
        Media savedMedia = mediaRepository.saveAndFlush(media);

        Document document = new Document();
        document.setUploadedBy(uploader);
        document.setMedia(savedMedia);
        document.setTitle(title);
        document.setDescription(description);
        document.setSlug(slug);
        document.setVisibilityStatus(DocumentVisibilityStatus.HIDDEN);
        Document savedDocument;
        try {
            savedDocument = documentRepository.saveAndFlush(document);
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(HttpStatus.CONFLICT, DUPLICATE_SLUG_MESSAGE);
        }

        saveTags(savedDocument, request.tagSlugs());

        DocumentSubmission submission = new DocumentSubmission();
        submission.setDocument(savedDocument);
        submission.setSubmittedBy(uploader);
        submission.setStatus(DocumentSubmissionStatus.PENDING_PROCESSING);
        submission.setSubmittedAt(Instant.now());
        DocumentSubmission savedSubmission = submissionRepository.saveAndFlush(submission);

        String uploadUrl = storageService.presignedPutUrl(objectKey, declaredMimeType);
        return new DocumentUploadInitResponse(
                savedDocument.getId(),
                savedSubmission.getId(),
                savedMedia.getId(),
                uploadUrl,
                storageService.uploadUrlExpiresAt(),
                savedMedia.getFileName(),
                savedMedia.getMimeType(),
                sizeBytes,
                savedDocument.getVisibilityStatus(),
                savedMedia.getStatus(),
                savedSubmission.getStatus());
    }

    @Transactional
    public DocumentUploadResponse completeUpload(UUID uploaderUserId, UUID submissionId) {
        DocumentSubmission submission = findSubmission(submissionId);
        if (submission.getSubmittedBy() != null
                && !submission.getSubmittedBy().getId().equals(uploaderUserId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You cannot complete this document upload.");
        }

        if (submission.getStatus() != DocumentSubmissionStatus.PENDING_PROCESSING) {
            return toUploadResponse(submission);
        }

        Media media = submission.getDocument().getMedia();
        StorageObjectMetadata metadata;
        try {
            metadata = storageService.statObject(media.getObjectKey());
        } catch (StorageException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The uploaded object was not found in storage.");
        }

        if (metadata.size() != media.getSizeBytes()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The uploaded object size does not match the declaration.");
        }
        if (!media.getMimeType().equalsIgnoreCase(metadata.contentType())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The uploaded object MIME type does not match the declaration.");
        }
        validateContentSignature(media.getFileName(), metadata.prefix());

        media.setStatus(MediaStatus.READY);
        submission.setStatus(DocumentSubmissionStatus.PENDING_REVIEW);
        mediaRepository.saveAndFlush(media);
        submissionRepository.saveAndFlush(submission);
        return toUploadResponse(submission);
    }

    @Transactional
    public DocumentUploadResponse review(UUID reviewerUserId, UUID submissionId, DocumentReviewRequest request) {
        if (request == null || request.decision() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A review decision is required.");
        }
        DocumentSubmission submission = findSubmission(submissionId);
        DocumentReviewDecision decision = request.decision();
        if (submission.getStatus() == DocumentSubmissionStatus.APPROVED
                && decision == DocumentReviewDecision.APPROVED) {
            return toUploadResponse(submission);
        }
        if (submission.getStatus() == DocumentSubmissionStatus.REJECTED
                && decision == DocumentReviewDecision.REJECTED) {
            return toUploadResponse(submission);
        }
        if (submission.getStatus() != DocumentSubmissionStatus.PENDING_REVIEW) {
            throw new ApiException(HttpStatus.CONFLICT, "Only pending documents can be reviewed.");
        }
        if (decision == DocumentReviewDecision.REJECTED
                && (request.rejectionReason() == null || request.rejectionReason().isBlank())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "A rejection reason is required.");
        }
        if (submission.getDocument().getMedia().getStatus() != MediaStatus.READY) {
            throw new ApiException(HttpStatus.CONFLICT, "The document is not ready for review.");
        }

        Document document = submission.getDocument();
        document.setVisibilityStatus(decision == DocumentReviewDecision.APPROVED
                ? DocumentVisibilityStatus.PUBLIC
                : DocumentVisibilityStatus.HIDDEN);
        submission.setStatus(decision == DocumentReviewDecision.APPROVED
                ? DocumentSubmissionStatus.APPROVED
                : DocumentSubmissionStatus.REJECTED);
        submission.setRejectionReason(decision == DocumentReviewDecision.REJECTED
                ? request.rejectionReason().strip()
                : null);
        submission.setReviewedBy(userAccountRepository.getReferenceById(reviewerUserId));
        submission.setReviewedAt(Instant.now());
        documentRepository.saveAndFlush(document);
        submissionRepository.saveAndFlush(submission);
        return toUploadResponse(submission);
    }

    @Transactional(readOnly = true)
    public List<DocumentSubmissionResponse> listMySubmissions(UUID userId) {
        return submissionRepository.findBySubmittedBy_IdOrderBySubmittedAtDesc(userId).stream()
                .map(this::toSubmissionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DocumentSubmissionResponse> listAdminSubmissions() {
        return submissionRepository.findAllByOrderBySubmittedAtDesc().stream()
                .map(this::toSubmissionResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DocumentPreviewResponse previewSubmission(UUID submissionId) {
        DocumentSubmission submission = findSubmission(submissionId);
        String url = storageService.presignedGetUrl(submission.getDocument().getMedia().getObjectKey());
        Media media = submission.getDocument().getMedia();
        return new DocumentPreviewResponse(
                submission.getDocument().getId(),
                submission.getId(),
                submission.getDocument().getTitle(),
                media.getFileName(),
                media.getMimeType(),
                media.getSizeBytes(),
                submission.getStatus(),
                url,
                url);
    }

    private DocumentSubmission findSubmission(UUID submissionId) {
        return submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Document submission not found."));
    }

    private DocumentUploadResponse toUploadResponse(DocumentSubmission submission) {
        Document document = submission.getDocument();
        Media media = document.getMedia();
        return new DocumentUploadResponse(
                document.getId(),
                submission.getId(),
                media.getId(),
                document.getTitle(),
                document.getSlug(),
                document.getDescription(),
                media.getFileName(),
                media.getMimeType(),
                media.getSizeBytes(),
                document.getVisibilityStatus(),
                media.getStatus(),
                submission.getStatus(),
                submission.getSubmittedAt());
    }

    private DocumentSubmissionResponse toSubmissionResponse(DocumentSubmission submission) {
        Document document = submission.getDocument();
        Media media = document.getMedia();
        return new DocumentSubmissionResponse(
                document.getId(),
                submission.getId(),
                document.getTitle(),
                document.getDescription(),
                document.getSlug(),
                media.getFileName(),
                media.getMimeType(),
                media.getSizeBytes(),
                document.getDocumentCollections().stream()
                        .map(link -> link.getCollection().getSlug())
                        .sorted()
                        .toList(),
                document.getDocumentTags().stream()
                        .map(link -> link.getTag().getSlug())
                        .sorted()
                        .toList(),
                submission.getSubmittedBy() == null ? null : submission.getSubmittedBy().getFullName(),
                document.getVisibilityStatus(),
                media.getStatus(),
                submission.getStatus(),
                submission.getSubmittedAt(),
                submission.getReviewedAt(),
                submission.getRejectionReason());
    }

    private void saveTags(Document document, List<String> tagSlugs) {
        if (tagSlugs == null || tagSlugs.isEmpty()) {
            return;
        }
        List<DocumentTag> links = new LinkedHashSet<>(tagSlugs).stream()
                .map(String::strip)
                .filter(slug -> !slug.isBlank())
                .map(slug -> tagRepository.findBySlug(slug)
                        .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Tag not found: " + slug)))
                .map(tag -> documentTag(document, tag))
                .toList();
        documentTagRepository.saveAll(links);
    }

    private static DocumentTag documentTag(Document document, Tag tag) {
        DocumentTag link = new DocumentTag();
        link.setDocument(document);
        link.setTag(tag);
        return link;
    }

    private void validateExtension(String extension) {
        if (extension == null || !allowedExtensions.contains(extension)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, INVALID_EXTENSION_MESSAGE);
        }
    }

    private static String normalizeMimeType(String mimeType) {
        if (mimeType == null || mimeType.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "MIME type is required.");
        }
        return mimeType.strip().toLowerCase(Locale.ROOT);
    }

    private static void validateContentSignature(String fileName, byte[] prefix) {
        String extension = extensionOf(fileName);
        if ("pdf".equals(extension) && !startsWith(prefix, new byte[] {'%', 'P', 'D', 'F', '-'})) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The uploaded PDF signature is invalid.");
        }
        if (("docx".equals(extension) || "pptx".equals(extension))
                && !startsWith(prefix, new byte[] {'P', 'K', 3, 4})) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The uploaded Office document signature is invalid.");
        }
    }

    private static boolean startsWith(byte[] value, byte[] prefix) {
        if (value == null || value.length < prefix.length) {
            return false;
        }
        for (int index = 0; index < prefix.length; index++) {
            if (value[index] != prefix[index]) {
                return false;
            }
        }
        return true;
    }

    @Transactional
    public DocumentUploadResponse upload(UUID uploaderUserId, UploadDocumentRequest request) {
        if (request == null || request.file() == null || request.file().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, EMPTY_FILE_MESSAGE);
        }

        String title = normalizeTitle(request.title());
        String description = normalizeDescription(request.description());
        MultipartFile file = request.file();
        String fileName = safeFileName(file.getOriginalFilename());
        String extension = extensionOf(fileName);

        if (extension == null || !allowedExtensions.contains(extension)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, INVALID_EXTENSION_MESSAGE);
        }
        if (file.getSize() > Integer.MAX_VALUE) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The document is too large.");
        }
        String slug = resolveSlug(title, request.slug());

        String objectKey = DOCUMENT_FOLDER + "/" + UUID.randomUUID() + "." + extension;
        try (InputStream content = file.getInputStream()) {
            storageService.upload(objectKey, content, file.getSize(), mimeTypeOf(extension));
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, FILE_READ_MESSAGE);
        }
        deleteObjectIfTransactionRollsBack(objectKey);

        var uploader = userAccountRepository.getReferenceById(uploaderUserId);

        Media media = new Media();
        media.setUploadedBy(uploader);
        media.setFileName(fileName);
        media.setMimeType(mimeTypeOf(extension));
        media.setSizeBytes(Math.toIntExact(file.getSize()));
        media.setObjectKey(objectKey);
        media.setStatus(MediaStatus.QUARANTINED);
        Media savedMedia = mediaRepository.saveAndFlush(media);

        Document document = new Document();
        document.setUploadedBy(uploader);
        document.setMedia(savedMedia);
        document.setTitle(title);
        document.setDescription(description);
        document.setSlug(slug);
        document.setVisibilityStatus(DocumentVisibilityStatus.HIDDEN);
        Document savedDocument;
        try {
            savedDocument = documentRepository.saveAndFlush(document);
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(HttpStatus.CONFLICT, DUPLICATE_SLUG_MESSAGE);
        }

        DocumentSubmission submission = new DocumentSubmission();
        submission.setDocument(savedDocument);
        submission.setSubmittedBy(uploader);
        submission.setStatus(DocumentSubmissionStatus.PENDING_PROCESSING);
        submission.setSubmittedAt(Instant.now());
        DocumentSubmission savedSubmission = submissionRepository.saveAndFlush(submission);

        return new DocumentUploadResponse(
                savedDocument.getId(),
                savedSubmission.getId(),
                savedMedia.getId(),
                savedDocument.getTitle(),
                savedDocument.getSlug(),
                savedDocument.getDescription(),
                savedMedia.getFileName(),
                savedMedia.getMimeType(),
                savedMedia.getSizeBytes(),
                savedDocument.getVisibilityStatus(),
                savedMedia.getStatus(),
                savedSubmission.getStatus(),
                savedSubmission.getSubmittedAt());
    }

    private void deleteObjectIfTransactionRollsBack(String objectKey) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    storageService.delete(objectKey);
                }
            }
        });
    }

    private static Set<String> parseAllowedExtensions(String configuredExtensions) {
        if (configuredExtensions == null || configuredExtensions.isBlank()) {
            return Set.of();
        }
        Set<String> extensions = new LinkedHashSet<>();
        Arrays.stream(configuredExtensions.split(","))
                .map(String::strip)
                .map(extension -> extension.toLowerCase(Locale.ROOT))
                .filter(extension -> !extension.isBlank())
                .forEach(extensions::add);
        return Collections.unmodifiableSet(extensions);
    }

    private static String normalizeTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, INVALID_TITLE_MESSAGE);
        }
        return title.strip();
    }

    private static String normalizeDescription(String description) {
        if (description == null || description.isBlank()) {
            return null;
        }
        return description.strip();
    }

    private String resolveSlug(String title, String requestedSlug) {
        String manualSlug = requestedSlug == null ? null : requestedSlug.strip();
        if (manualSlug != null && !manualSlug.isBlank()) {
            if (!SLUG_PATTERN.matcher(manualSlug).matches()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, INVALID_SLUG_MESSAGE);
            }
            if (documentRepository.existsBySlug(manualSlug)) {
                throw new ApiException(HttpStatus.CONFLICT, DUPLICATE_SLUG_MESSAGE);
            }
            return manualSlug;
        }

        for (int attempt = 0; attempt < 5; attempt++) {
            String generatedSlug = createSlug(title);
            if (!documentRepository.existsBySlug(generatedSlug)) {
                return generatedSlug;
            }
        }
        throw new ApiException(HttpStatus.CONFLICT, "Could not generate a unique document slug.");
    }

    private static String safeFileName(String originalFileName) {
        if (originalFileName == null || originalFileName.isBlank()) {
            return "";
        }
        String fileName = originalFileName.replace('\\', '/');
        fileName = fileName.substring(fileName.lastIndexOf('/') + 1).strip();
        if (fileName.length() <= 255) {
            return fileName;
        }

        int extensionStart = fileName.lastIndexOf('.');
        if (extensionStart <= 0) {
            return fileName.substring(0, 255);
        }

        String extension = fileName.substring(extensionStart);
        int baseLength = Math.max(1, 255 - extension.length());
        return fileName.substring(0, baseLength) + extension;
    }

    private static String extensionOf(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot <= 0 || dot == fileName.length() - 1) {
            return null;
        }
        return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static String mimeTypeOf(String extension) {
        return switch (extension) {
            case "pdf" -> "application/pdf";
            case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
            case "pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation";
            case "txt" -> "text/plain";
            default -> "application/octet-stream";
        };
    }

    private static String createSlug(String title) {
        String base = Normalizer.normalize(title, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        if (base.isBlank()) {
            base = "document";
        }
        return base + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    }
}
