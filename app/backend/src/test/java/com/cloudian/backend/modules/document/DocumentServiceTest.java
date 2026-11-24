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
import com.cloudian.backend.models.Collection;
import com.cloudian.backend.models.Document;
import com.cloudian.backend.models.DocumentCollection;
import com.cloudian.backend.models.DocumentSubmission;
import com.cloudian.backend.models.DocumentTag;
import com.cloudian.backend.models.Media;
import com.cloudian.backend.models.Tag;
import com.cloudian.backend.models.ids.DocumentCollectionId;
import com.cloudian.backend.modules.document.dto.DocumentTaxonomyUpdateRequest;
import com.cloudian.backend.repositories.CollectionRepository;
import com.cloudian.backend.repositories.DocumentCollectionRepository;
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
import com.cloudian.backend.modules.document.messaging.ClassificationEventWriter;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    private static final UUID USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID MEDIA_ID = UUID.fromString("00000000-0000-0000-0000-000000009001");
    private static final UUID DOCUMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000009002");
    private static final UUID SUBMISSION_ID = UUID.fromString("00000000-0000-0000-0000-000000009003");
    private static final UUID COLLECTION_ONE_ID = UUID.fromString("00000000-0000-0000-0000-000000009101");
    private static final UUID COLLECTION_TWO_ID = UUID.fromString("00000000-0000-0000-0000-000000009102");
    private static final UUID TAG_ONE_ID = UUID.fromString("00000000-0000-0000-0000-000000009103");
    private static final UUID TAG_TWO_ID = UUID.fromString("00000000-0000-0000-0000-000000009104");

    @Mock
    private StorageService storageService;

    @Mock
    private MediaRepository mediaRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private CollectionRepository collectionRepository;

    @Mock
    private DocumentCollectionRepository documentCollectionRepository;

    @Mock
    private DocumentSubmissionRepository submissionRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private DocumentTagRepository documentTagRepository;

    @Mock
    private ClassificationEventWriter classificationEventWriter;

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
        assertThat(response.sizeBytes()).isEqualTo(7);
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
        assertThat(media.getValue().getSizeBytes()).isEqualTo(7);
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

        assertThat(response.mediaStatus()).isEqualTo(MediaStatus.SCANNING);
        assertThat(response.submissionStatus()).isEqualTo(DocumentSubmissionStatus.PENDING_PROCESSING);
        assertThat(response.visibilityStatus()).isEqualTo(DocumentVisibilityStatus.HIDDEN);
        verify(classificationEventWriter, org.mockito.Mockito.never()).enqueue(any(DocumentSubmission.class));
    }

    @Test
    void enqueuesReadyMediaOnRepeatedCompletionWithoutCreatingASecondRunHere() {
        Document document = pendingDocument();
        DocumentSubmission submission = pendingSubmission(document);
        submission.setStatus(DocumentSubmissionStatus.PENDING_PROCESSING);
        when(submissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));

        service().completeUpload(USER_ID, SUBMISSION_ID);
        DocumentUploadResponse duplicateResponse = service().completeUpload(USER_ID, SUBMISSION_ID);

        assertThat(duplicateResponse.mediaStatus()).isEqualTo(MediaStatus.READY);
        assertThat(duplicateResponse.submissionStatus()).isEqualTo(DocumentSubmissionStatus.PENDING_PROCESSING);
        verify(classificationEventWriter, org.mockito.Mockito.times(2)).enqueue(submission);
        verifyNoInteractions(storageService);
    }

    @Test
    void rejectsCompletionWhenMediaWasRejectedByScanning() {
        Document document = pendingDocument();
        document.getMedia().setStatus(MediaStatus.REJECTED);
        DocumentSubmission submission = pendingSubmission(document);
        submission.setStatus(DocumentSubmissionStatus.PENDING_PROCESSING);
        when(submissionRepository.findById(SUBMISSION_ID)).thenReturn(Optional.of(submission));

        assertThatThrownBy(() -> service().completeUpload(USER_ID, SUBMISSION_ID))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("scan");

        verifyNoInteractions(storageService, classificationEventWriter);
    }

    @Test
    void rejectsCompletionWhenStorageMetadataDoesNotMatchDeclaration() {
        Document document = pendingDocument();
        document.getMedia().setStatus(MediaStatus.QUARANTINED);
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

    @Test
    void replacesTaxonomyForAnApprovedDocumentAndDeduplicatesSlugs() {
        Document document = pendingDocument();
        document.setVisibilityStatus(DocumentVisibilityStatus.PUBLIC);
        document.getDocumentCollections().add(documentCollection(document, collection("old-collection", COLLECTION_ONE_ID)));
        document.getDocumentTags().add(documentTag(document, tag("old-tag", TAG_ONE_ID)));
        Collection replacementCollection = collection("replacement-collection", COLLECTION_TWO_ID);
        Tag replacementTag = tag("replacement-tag", TAG_TWO_ID);
        when(documentRepository.findByIdForUpdate(DOCUMENT_ID)).thenReturn(Optional.of(document));
        when(collectionRepository.findBySlug("replacement-collection"))
                .thenReturn(Optional.of(replacementCollection));
        when(tagRepository.findBySlug("replacement-tag")).thenReturn(Optional.of(replacementTag));
        when(documentCollectionRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(documentTagRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service().updateTaxonomy(
                DOCUMENT_ID,
                new DocumentTaxonomyUpdateRequest(
                        List.of("replacement-collection", "replacement-collection"),
                        List.of("replacement-tag", "replacement-tag")));

        assertThat(response.documentId()).isEqualTo(DOCUMENT_ID);
        assertThat(response.collectionSlugs()).containsExactly("replacement-collection");
        assertThat(response.tagSlugs()).containsExactly("replacement-tag");
        assertThat(document.getDocumentCollections())
                .extracting(link -> link.getCollection().getSlug())
                .containsExactly("replacement-collection");
        assertThat(document.getDocumentTags())
                .extracting(link -> link.getTag().getSlug())
                .containsExactly("replacement-tag");
        verify(documentCollectionRepository).deleteByDocument_Id(DOCUMENT_ID);
        verify(documentCollectionRepository).flush();
        verify(documentTagRepository).deleteByDocument_Id(DOCUMENT_ID);
        verify(documentTagRepository).flush();
    }

    @Test
    void clearsBothTaxonomyListsWhenSelectionsAreEmpty() {
        Document document = pendingDocument();
        document.getDocumentCollections().add(documentCollection(document, collection("old-collection", COLLECTION_ONE_ID)));
        document.getDocumentTags().add(documentTag(document, tag("old-tag", TAG_ONE_ID)));
        when(documentRepository.findByIdForUpdate(DOCUMENT_ID)).thenReturn(Optional.of(document));

        var response = service().updateTaxonomy(
                DOCUMENT_ID,
                new DocumentTaxonomyUpdateRequest(List.of(), List.of()));

        assertThat(response.collectionSlugs()).isEmpty();
        assertThat(response.tagSlugs()).isEmpty();
        assertThat(document.getDocumentCollections()).isEmpty();
        assertThat(document.getDocumentTags()).isEmpty();
        verify(documentCollectionRepository).deleteByDocument_Id(DOCUMENT_ID);
        verify(documentTagRepository).deleteByDocument_Id(DOCUMENT_ID);
        verify(documentCollectionRepository, org.mockito.Mockito.never()).saveAll(any());
        verify(documentTagRepository, org.mockito.Mockito.never()).saveAll(any());
    }

    @Test
    void rejectsUnknownTaxonomySlugBeforeDeletingExistingLinks() {
        Document document = pendingDocument();
        document.getDocumentCollections().add(documentCollection(document, collection("old-collection", COLLECTION_ONE_ID)));
        when(documentRepository.findByIdForUpdate(DOCUMENT_ID)).thenReturn(Optional.of(document));
        when(collectionRepository.findBySlug("missing-collection")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service().updateTaxonomy(
                DOCUMENT_ID,
                new DocumentTaxonomyUpdateRequest(List.of("missing-collection"), List.of())))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Collection not found");

        assertThat(document.getDocumentCollections())
                .extracting(link -> link.getCollection().getSlug())
                .containsExactly("old-collection");
        verify(documentCollectionRepository, org.mockito.Mockito.never()).deleteByDocument_Id(any());
        verify(documentTagRepository, org.mockito.Mockito.never()).deleteByDocument_Id(any());
    }

    @Test
    void rejectsBlankTaxonomySlugBeforeDeletingExistingLinks() {
        Document document = pendingDocument();
        when(documentRepository.findByIdForUpdate(DOCUMENT_ID)).thenReturn(Optional.of(document));

        assertThatThrownBy(() -> service().updateTaxonomy(
                DOCUMENT_ID,
                new DocumentTaxonomyUpdateRequest(List.of("  "), List.of())))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Collection slug");

        verify(documentCollectionRepository, org.mockito.Mockito.never()).deleteByDocument_Id(any());
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
                collectionRepository,
                documentCollectionRepository,
                submissionRepository,
                userAccountRepository,
                tagRepository,
                documentTagRepository,
                classificationEventWriter,
                "pdf,docx,pptx,txt",
                5_242_880L);
    }

    private static Collection collection(String slug, UUID id) {
        Collection collection = new Collection();
        collection.setId(id);
        collection.setName(slug);
        collection.setSlug(slug);
        return collection;
    }

    private static Tag tag(String slug, UUID id) {
        Tag tag = new Tag();
        tag.setId(id);
        tag.setName(slug);
        tag.setSlug(slug);
        tag.setDescription(slug);
        return tag;
    }

    private static DocumentCollection documentCollection(Document document, Collection collection) {
        DocumentCollection link = new DocumentCollection();
        link.setId(new DocumentCollectionId(document.getId(), collection.getId()));
        link.setDocument(document);
        link.setCollection(collection);
        return link;
    }

    private static DocumentTag documentTag(Document document, Tag tag) {
        DocumentTag link = new DocumentTag();
        link.setDocument(document);
        link.setTag(tag);
        return link;
    }
}
