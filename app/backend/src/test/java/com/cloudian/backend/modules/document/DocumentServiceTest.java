package com.cloudian.backend.modules.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.UUID;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.cloudian.backend.commons.enums.DocumentSubmissionStatus;
import com.cloudian.backend.commons.enums.DocumentVisibilityStatus;
import com.cloudian.backend.commons.enums.MediaStatus;
import com.cloudian.backend.exceptions.ApiException;
import com.cloudian.backend.models.Document;
import com.cloudian.backend.models.DocumentSubmission;
import com.cloudian.backend.models.Media;
import com.cloudian.backend.repositories.DocumentTagRepository;
import com.cloudian.backend.repositories.DocumentRepository;
import com.cloudian.backend.repositories.DocumentSubmissionRepository;
import com.cloudian.backend.repositories.MediaRepository;
import com.cloudian.backend.repositories.TagRepository;
import com.cloudian.backend.repositories.UserAccountRepository;
import com.cloudian.backend.services.StorageService;
import com.cloudian.backend.services.StorageService.StorageObjectMetadata;
import com.cloudian.backend.modules.document.dto.DocumentUploadResponse;
import com.cloudian.backend.modules.document.dto.DocumentReviewRequest;
import com.cloudian.backend.modules.document.dto.DocumentUploadInitRequest;
import com.cloudian.backend.modules.document.dto.UploadDocumentRequest;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID MEDIA_ID = UUID.fromString("00000000-0000-0000-0000-000000009001");
    private static final UUID DOCUMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000009002");
    private static final UUID SUBMISSION_ID = UUID.fromString("00000000-0000-0000-0000-000000009003");

    @Mock
    private StorageService storageService;

    @Mock
    private MediaRepository mediaRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private DocumentSubmissionRepository submissionRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private DocumentTagRepository documentTagRepository;

    @Test
    void rejectsUnsupportedExtensionBeforeStorageOrDatabase() {
        DocumentService service = service();
        UploadDocumentRequest request = new UploadDocumentRequest(
                "Unsupported document",
                null,
                null,
                new MockMultipartFile("file", "malware.exe", "application/octet-stream", new byte[] {1}));

        assertThatThrownBy(() -> service.upload(USER_ID, request))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("allowed");

        verifyNoInteractions(storageService, mediaRepository, documentRepository,
                submissionRepository, userAccountRepository);
    }

    @Test
    void uploadsFileAndCreatesPendingDocumentRecordsWithoutClassification() {
        when(userAccountRepository.getReferenceById(USER_ID)).thenReturn(null);
        when(mediaRepository.saveAndFlush(any(Media.class))).thenAnswer(invocation -> {
            Media media = invocation.getArgument(0);
            media.setId(MEDIA_ID);
            return media;
        });
        when(documentRepository.saveAndFlush(any(Document.class))).thenAnswer(invocation -> {
            Document document = invocation.getArgument(0);
            document.setId(DOCUMENT_ID);
            return document;
        });
        when(submissionRepository.saveAndFlush(any(DocumentSubmission.class))).thenAnswer(invocation -> {
            DocumentSubmission submission = invocation.getArgument(0);
            submission.setId(SUBMISSION_ID);
            return submission;
        });

        DocumentUploadResponse response = service().upload(
                USER_ID,
                new UploadDocumentRequest(
                        "My document",
                        "Document description",
                        null,
                        new MockMultipartFile(
                                "file",
                                "course.PDF",
                                "application/octet-stream",
                                "content".getBytes())));

        assertThat(response.documentId()).isEqualTo(DOCUMENT_ID);
        assertThat(response.submissionId()).isEqualTo(SUBMISSION_ID);
        assertThat(response.mediaId()).isEqualTo(MEDIA_ID);
        assertThat(response.slug()).matches("my-document-[a-f0-9]{10}");
        assertThat(response.submissionStatus()).isEqualTo(DocumentSubmissionStatus.PENDING_PROCESSING);
        assertThat(response.mediaStatus()).isEqualTo(MediaStatus.QUARANTINED);
        assertThat(response.visibilityStatus()).isEqualTo(DocumentVisibilityStatus.HIDDEN);

        ArgumentCaptor<Media> media = ArgumentCaptor.forClass(Media.class);
        ArgumentCaptor<Document> document = ArgumentCaptor.forClass(Document.class);
        ArgumentCaptor<DocumentSubmission> submission = ArgumentCaptor.forClass(DocumentSubmission.class);
        verify(mediaRepository).saveAndFlush(media.capture());
        verify(documentRepository).saveAndFlush(document.capture());
        verify(submissionRepository).saveAndFlush(submission.capture());

        assertThat(media.getValue().getFileName()).isEqualTo("course.PDF");
        assertThat(media.getValue().getMimeType()).isEqualTo("application/pdf");
        assertThat(media.getValue().getStatus()).isEqualTo(MediaStatus.QUARANTINED);
        assertThat(document.getValue().getTitle()).isEqualTo("My document");
        assertThat(document.getValue().getDescription()).isEqualTo("Document description");
        assertThat(document.getValue().getVisibilityStatus()).isEqualTo(DocumentVisibilityStatus.HIDDEN);
        assertThat(submission.getValue().getStatus()).isEqualTo(DocumentSubmissionStatus.PENDING_PROCESSING);

        verify(storageService).upload(any(), any(), any(Long.class), any());
    }

    @Test
    void deletesMinioObjectWhenDatabasePersistenceFails() {
        when(userAccountRepository.getReferenceById(USER_ID)).thenReturn(null);
        when(mediaRepository.saveAndFlush(any(Media.class)))
                .thenThrow(new IllegalStateException("database failure"));
        TransactionSynchronizationManager.initSynchronization();

        try {
            assertThatThrownBy(() -> service().upload(
                    USER_ID,
                    new UploadDocumentRequest(
                            "My document",
                            null,
                            null,
                            new MockMultipartFile(
                                    "file",
                                    "course.pdf",
                                    "application/pdf",
                                    "content".getBytes()))))
                    .isInstanceOf(IllegalStateException.class);

            TransactionSynchronizationManager.getSynchronizations()
                    .forEach(synchronization ->
                            synchronization.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
            verify(storageService).delete(any());
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void rejectsDuplicateManualSlugBeforeUploading() {
        when(documentRepository.existsBySlug("existing-document")).thenReturn(true);

        assertThatThrownBy(() -> service().upload(
                USER_ID,
                new UploadDocumentRequest(
                        "My document",
                        null,
                        "existing-document",
                        new MockMultipartFile(
                                "file",
                                "course.pdf",
                                "application/pdf",
                                "content".getBytes()))))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("already exists");

        verify(documentRepository).existsBySlug("existing-document");
        verifyNoInteractions(storageService, mediaRepository, submissionRepository, userAccountRepository);
    }

    @Test
    void initializesDirectUploadWithoutUploadingTheFile() {
        when(userAccountRepository.getReferenceById(USER_ID)).thenReturn(null);
        when(mediaRepository.saveAndFlush(any(Media.class))).thenAnswer(invocation -> {
            Media media = invocation.getArgument(0);
            media.setId(MEDIA_ID);
            return media;
        });
        when(documentRepository.saveAndFlush(any(Document.class))).thenAnswer(invocation -> {
            Document document = invocation.getArgument(0);
            document.setId(DOCUMENT_ID);
            return document;
        });
        when(submissionRepository.saveAndFlush(any(DocumentSubmission.class))).thenAnswer(invocation -> {
            DocumentSubmission submission = invocation.getArgument(0);
            submission.setId(SUBMISSION_ID);
            return submission;
        });
        when(storageService.presignedPutUrl(any(), any())).thenReturn("http://minio/upload");

        var response = service().initUpload(USER_ID, new DocumentUploadInitRequest(
                "My document", "Description", null, "course.pdf", "application/pdf", 7L, List.of()));

        assertThat(response.uploadUrl()).isEqualTo("http://minio/upload");
        assertThat(response.submissionId()).isEqualTo(SUBMISSION_ID);
        assertThat(response.mediaStatus()).isEqualTo(MediaStatus.QUARANTINED);
        assertThat(response.submissionStatus()).isEqualTo(DocumentSubmissionStatus.PENDING_PROCESSING);
        verify(storageService).presignedPutUrl(any(), any());
        verify(storageService, org.mockito.Mockito.never()).upload(any(), any(), any(Long.class), any());
    }

    @Test
    void completesUploadOnlyWhenMinioObjectMatchesDeclaredMetadata() {
        Media media = new Media();
        media.setId(MEDIA_ID);
        media.setObjectKey("documents/object.pdf");
        media.setFileName("course.pdf");
        media.setMimeType("application/pdf");
        media.setSizeBytes(7);
        media.setStatus(MediaStatus.QUARANTINED);

        Document document = new Document();
        document.setId(DOCUMENT_ID);
        document.setMedia(media);
        document.setVisibilityStatus(DocumentVisibilityStatus.HIDDEN);
        document.setTitle("My document");
        document.setSlug("my-document");

        DocumentSubmission submission = new DocumentSubmission();
        submission.setId(SUBMISSION_ID);
        submission.setDocument(document);
        submission.setStatus(DocumentSubmissionStatus.PENDING_PROCESSING);
        submission.setSubmittedAt(java.time.Instant.now());

        when(submissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));
        when(storageService.statObject("documents/object.pdf"))
                .thenReturn(new StorageObjectMetadata(7L, "application/pdf", "etag", new byte[] {'%', 'P', 'D', 'F', '-'}));
        when(mediaRepository.saveAndFlush(any(Media.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(submissionRepository.saveAndFlush(any(DocumentSubmission.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DocumentUploadResponse response = service().completeUpload(USER_ID, SUBMISSION_ID);

        assertThat(response.mediaStatus()).isEqualTo(MediaStatus.READY);
        assertThat(response.submissionStatus()).isEqualTo(DocumentSubmissionStatus.PENDING_REVIEW);
        assertThat(response.visibilityStatus()).isEqualTo(DocumentVisibilityStatus.HIDDEN);
    }

    @Test
    void rejectsCompletionWhenStorageMetadataDoesNotMatchDeclaration() {
        Document document = pendingDocument();
        DocumentSubmission submission = pendingSubmission(document);
        submission.setStatus(DocumentSubmissionStatus.PENDING_PROCESSING);
        when(submissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));
        when(storageService.statObject("documents/object.pdf"))
                .thenReturn(new StorageObjectMetadata(8L, "application/pdf", "etag", new byte[] {'%', 'P', 'D', 'F', '-'}));

        assertThatThrownBy(() -> service().completeUpload(USER_ID, SUBMISSION_ID))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("size");

        verify(mediaRepository, org.mockito.Mockito.never()).saveAndFlush(any(Media.class));
        verify(submissionRepository, org.mockito.Mockito.never()).saveAndFlush(any(DocumentSubmission.class));
    }

    @Test
    void approvesPendingSubmissionAndPublishesDocument() {
        Document document = pendingDocument();
        DocumentSubmission submission = pendingSubmission(document);
        when(submissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));
        when(userAccountRepository.getReferenceById(USER_ID)).thenReturn(null);
        when(submissionRepository.saveAndFlush(any(DocumentSubmission.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(documentRepository.saveAndFlush(any(Document.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DocumentUploadResponse response = service().review(USER_ID, SUBMISSION_ID,
                new DocumentReviewRequest(com.cloudian.backend.modules.document.dto.DocumentReviewDecision.APPROVED, null));

        assertThat(response.submissionStatus()).isEqualTo(DocumentSubmissionStatus.APPROVED);
        assertThat(response.visibilityStatus()).isEqualTo(DocumentVisibilityStatus.PUBLIC);
    }

    @Test
    void rejectsPendingSubmissionAndKeepsDocumentHidden() {
        Document document = pendingDocument();
        DocumentSubmission submission = pendingSubmission(document);
        when(submissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));
        when(userAccountRepository.getReferenceById(USER_ID)).thenReturn(null);
        when(submissionRepository.saveAndFlush(any(DocumentSubmission.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(documentRepository.saveAndFlush(any(Document.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DocumentUploadResponse response = service().review(USER_ID, SUBMISSION_ID,
                new DocumentReviewRequest(com.cloudian.backend.modules.document.dto.DocumentReviewDecision.REJECTED, "Không đúng nội dung"));

        assertThat(response.submissionStatus()).isEqualTo(DocumentSubmissionStatus.REJECTED);
        assertThat(response.visibilityStatus()).isEqualTo(DocumentVisibilityStatus.HIDDEN);
    }

    @Test
    void canRejectAnAlreadyApprovedSubmission() {
        Document document = pendingDocument();
        document.setVisibilityStatus(DocumentVisibilityStatus.PUBLIC);
        DocumentSubmission submission = pendingSubmission(document);
        submission.setStatus(DocumentSubmissionStatus.APPROVED);
        when(submissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));
        when(userAccountRepository.getReferenceById(USER_ID)).thenReturn(null);
        when(submissionRepository.saveAndFlush(any(DocumentSubmission.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(documentRepository.saveAndFlush(any(Document.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DocumentUploadResponse response = service().review(USER_ID, SUBMISSION_ID,
                new DocumentReviewRequest(com.cloudian.backend.modules.document.dto.DocumentReviewDecision.REJECTED, "Cần kiểm tra lại"));

        assertThat(response.submissionStatus()).isEqualTo(DocumentSubmissionStatus.REJECTED);
        assertThat(response.visibilityStatus()).isEqualTo(DocumentVisibilityStatus.HIDDEN);
    }

    @Test
    void canApproveAnAlreadyRejectedSubmission() {
        Document document = pendingDocument();
        DocumentSubmission submission = pendingSubmission(document);
        submission.setStatus(DocumentSubmissionStatus.REJECTED);
        submission.setRejectionReason("Cần bổ sung thông tin");
        when(submissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));
        when(userAccountRepository.getReferenceById(USER_ID)).thenReturn(null);
        when(submissionRepository.saveAndFlush(any(DocumentSubmission.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(documentRepository.saveAndFlush(any(Document.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DocumentUploadResponse response = service().review(USER_ID, SUBMISSION_ID,
                new DocumentReviewRequest(com.cloudian.backend.modules.document.dto.DocumentReviewDecision.APPROVED, null));

        assertThat(response.submissionStatus()).isEqualTo(DocumentSubmissionStatus.APPROVED);
        assertThat(response.visibilityStatus()).isEqualTo(DocumentVisibilityStatus.PUBLIC);
    }

    private Document pendingDocument() {
        Media media = new Media();
        media.setId(MEDIA_ID);
        media.setFileName("course.pdf");
        media.setMimeType("application/pdf");
        media.setSizeBytes(7);
        media.setStatus(MediaStatus.READY);
        media.setObjectKey("documents/object.pdf");

        Document document = new Document();
        document.setId(DOCUMENT_ID);
        document.setMedia(media);
        document.setTitle("My document");
        document.setSlug("my-document");
        document.setVisibilityStatus(DocumentVisibilityStatus.HIDDEN);
        return document;
    }

    private DocumentSubmission pendingSubmission(Document document) {
        DocumentSubmission submission = new DocumentSubmission();
        submission.setId(SUBMISSION_ID);
        submission.setDocument(document);
        submission.setStatus(DocumentSubmissionStatus.PENDING_REVIEW);
        submission.setSubmittedAt(java.time.Instant.now());
        return submission;
    }

    private DocumentService service() {
        return new DocumentService(
                storageService,
                mediaRepository,
                documentRepository,
                submissionRepository,
                userAccountRepository,
                tagRepository,
                documentTagRepository,
                "pdf,docx,pptx,txt",
                5_242_880L);
    }
}
