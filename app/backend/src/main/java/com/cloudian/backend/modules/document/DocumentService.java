package com.cloudian.backend.modules.document;

import java.io.IOException;
import java.io.InputStream;
import java.text.Normalizer;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
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
import com.cloudian.backend.models.Document;
import com.cloudian.backend.models.DocumentSubmission;
import com.cloudian.backend.models.Media;
import com.cloudian.backend.modules.document.dto.DocumentUploadResponse;
import com.cloudian.backend.modules.document.dto.UploadDocumentRequest;
import com.cloudian.backend.repositories.DocumentRepository;
import com.cloudian.backend.repositories.DocumentSubmissionRepository;
import com.cloudian.backend.repositories.MediaRepository;
import com.cloudian.backend.repositories.UserAccountRepository;
import com.cloudian.backend.services.StorageService;

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
    private final Set<String> allowedExtensions;

    public DocumentService(
            StorageService storageService,
            MediaRepository mediaRepository,
            DocumentRepository documentRepository,
            DocumentSubmissionRepository submissionRepository,
            UserAccountRepository userAccountRepository,
            @Value("${app.agent.classfication.allowed:pdf,docx,pptx,txt}") String allowedExtensions) {
        this.storageService = storageService;
        this.mediaRepository = mediaRepository;
        this.documentRepository = documentRepository;
        this.submissionRepository = submissionRepository;
        this.userAccountRepository = userAccountRepository;
        this.allowedExtensions = parseAllowedExtensions(allowedExtensions);
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
