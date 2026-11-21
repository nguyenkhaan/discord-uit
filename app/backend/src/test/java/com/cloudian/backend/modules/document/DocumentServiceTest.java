package com.cloudian.backend.modules.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.UUID;

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
import com.cloudian.backend.repositories.DocumentRepository;
import com.cloudian.backend.repositories.DocumentSubmissionRepository;
import com.cloudian.backend.repositories.MediaRepository;
import com.cloudian.backend.repositories.UserAccountRepository;
import com.cloudian.backend.services.StorageService;
import com.cloudian.backend.modules.document.dto.DocumentUploadResponse;
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

    private DocumentService service() {
        return new DocumentService(
                storageService,
                mediaRepository,
                documentRepository,
                submissionRepository,
                userAccountRepository,
                "pdf,docx,pptx,txt");
    }
}
