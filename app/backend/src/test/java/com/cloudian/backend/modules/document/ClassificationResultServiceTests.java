package com.cloudian.backend.modules.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.cloudian.backend.commons.enums.ClassificationRunStatus;
import com.cloudian.backend.commons.enums.DocumentSubmissionStatus;
import com.cloudian.backend.commons.enums.MediaStatus;
import com.cloudian.backend.models.ClassificationRun;
import com.cloudian.backend.models.Collection;
import com.cloudian.backend.models.Document;
import com.cloudian.backend.models.DocumentSubmission;
import com.cloudian.backend.models.Media;
import com.cloudian.backend.models.Tag;
import com.cloudian.backend.modules.document.messaging.ClassificationCompletedEvent;
import com.cloudian.backend.modules.document.messaging.ClassificationFailedEvent;
import com.cloudian.backend.repositories.AgentClassificationCollectionRepository;
import com.cloudian.backend.repositories.AgentClassificationRepository;
import com.cloudian.backend.repositories.AgentClassificationTagRepository;
import com.cloudian.backend.repositories.ClassificationRunRepository;
import com.cloudian.backend.repositories.CollectionRepository;
import com.cloudian.backend.repositories.DocumentSubmissionRepository;
import com.cloudian.backend.repositories.TagRepository;

@ExtendWith(MockitoExtension.class)
class ClassificationResultServiceTests {

    private static final UUID SUBMISSION_ID = UUID.fromString("00000000-0000-0000-0000-000000006101");
    private static final UUID DOCUMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000006102");
    private static final UUID MEDIA_ID = UUID.fromString("00000000-0000-0000-0000-000000006103");
    private static final Instant NOW = Instant.parse("2026-11-27T03:00:00Z");

    @Mock private ClassificationRunRepository classificationRunRepository;
    @Mock private DocumentSubmissionRepository documentSubmissionRepository;
    @Mock private AgentClassificationRepository agentClassificationRepository;
    @Mock private AgentClassificationCollectionRepository collectionLinkRepository;
    @Mock private AgentClassificationTagRepository tagLinkRepository;
    @Mock private CollectionRepository collectionRepository;
    @Mock private TagRepository tagRepository;

    private DocumentSubmission submission;
    private ClassificationRun run;
    private ClassificationResultService service;

    @BeforeEach
    void setUp() {
        submission = readySubmission();
        run = ClassificationRun.queued("run-6101", submission, submission.getDocument().getMedia(), NOW);
        ReflectionTestUtils.setField(run, "attemptCount", 1);
        run.transitionTo(ClassificationRunStatus.RUNNING, NOW);
        when(classificationRunRepository.findByClassificationRunIdForUpdate("run-6101"))
                .thenReturn(Optional.of(run));
        lenient().when(documentSubmissionRepository.findByIdForUpdate(SUBMISSION_ID))
                .thenReturn(Optional.of(submission));
        service = new ClassificationResultService(
                classificationRunRepository,
                documentSubmissionRepository,
                agentClassificationRepository,
                collectionLinkRepository,
                tagLinkRepository,
                collectionRepository,
                tagRepository,
                3);
    }

    @Test
    void persistsSuggestionsAndMovesOnlySubmissionToPendingReview() {
        Collection collection = collection("cloud-computing");
        Tag tag = tag("java");
        when(collectionRepository.findBySlug("cloud-computing")).thenReturn(Optional.of(collection));
        when(tagRepository.findBySlug("java")).thenReturn(Optional.of(tag));

        ClassificationResultService.Disposition result = service.handleCompleted(completedEvent());

        assertThat(result).isEqualTo(ClassificationResultService.Disposition.APPLIED);
        assertThat(run.getStatus()).isEqualTo(ClassificationRunStatus.SUCCEEDED);
        assertThat(run.getModelId()).isEqualTo("ocr-model-v1");
        assertThat(run.isOcrNeeded()).isTrue();
        assertThat(submission.getStatus()).isEqualTo(DocumentSubmissionStatus.PENDING_REVIEW);
        assertThat(submission.getDocument().getVisibilityStatus().name()).isEqualTo("HIDDEN");
        verify(agentClassificationRepository).save(any());
        verify(collectionLinkRepository).saveAll(any(Iterable.class));
        verify(tagLinkRepository).saveAll(any(Iterable.class));
        verify(classificationRunRepository).save(run);
        verify(documentSubmissionRepository).save(submission);
    }

    @Test
    void duplicateCompletionDoesNotPersistAnotherClassification() {
        when(collectionRepository.findBySlug("cloud-computing"))
                .thenReturn(Optional.of(collection("cloud-computing")));
        when(tagRepository.findBySlug("java")).thenReturn(Optional.of(tag("java")));
        service.handleCompleted(completedEvent());

        ClassificationResultService.Disposition duplicate = service.handleCompleted(completedEvent());

        assertThat(duplicate).isEqualTo(ClassificationResultService.Disposition.IGNORED);
        verify(agentClassificationRepository).save(any());
    }

    @Test
    void staleSubmissionIsIgnoredWithoutChangingItsStatus() {
        submission.setStatus(DocumentSubmissionStatus.APPROVED);

        ClassificationResultService.Disposition result = service.handleCompleted(completedEvent());

        assertThat(result).isEqualTo(ClassificationResultService.Disposition.IGNORED);
        assertThat(submission.getStatus()).isEqualTo(DocumentSubmissionStatus.APPROVED);
        verify(agentClassificationRepository, never()).save(any());
    }

    @Test
    void mismatchedMediaIsIgnored() {
        ClassificationCompletedEvent event = completedEvent();
        ClassificationCompletedEvent mismatched = new ClassificationCompletedEvent(
                event.schemaVersion(), event.eventId(), event.classificationRunId(), event.documentId(),
                event.submissionId(), UUID.randomUUID(), event.modelId(), event.ocrText(), event.ocrNeeded(),
                event.collectionSuggestions(), event.tagSuggestions(), event.attempt(), event.occurredAt());

        ClassificationResultService.Disposition result = service.handleCompleted(mismatched);

        assertThat(result).isEqualTo(ClassificationResultService.Disposition.IGNORED);
        assertThat(submission.getStatus()).isEqualTo(DocumentSubmissionStatus.PENDING_PROCESSING);
        verify(agentClassificationRepository, never()).save(any());
    }

    @Test
    void unknownTaxonomySlugRejectsWholeResultWithoutChangingOfficialTaxonomy() {
        when(collectionRepository.findBySlug("cloud-computing")).thenReturn(Optional.empty());

        ClassificationResultService.Disposition result = service.handleCompleted(completedEvent());

        assertThat(result).isEqualTo(ClassificationResultService.Disposition.REJECTED);
        assertThat(run.getStatus()).isEqualTo(ClassificationRunStatus.FAILED);
        assertThat(run.getFailureCode()).isEqualTo("INVALID_RESULT");
        assertThat(submission.getStatus()).isEqualTo(DocumentSubmissionStatus.PENDING_PROCESSING);
        verify(agentClassificationRepository, never()).save(any());
        verify(collectionLinkRepository, never()).saveAll(any(Iterable.class));
        verify(tagLinkRepository, never()).saveAll(any(Iterable.class));
    }

    @Test
    void outOfRangeConfidenceRejectsWholeResult() {
        ClassificationCompletedEvent event = withCollectionSuggestion("cloud-computing", 1.01);

        ClassificationResultService.Disposition result = service.handleCompleted(event);

        assertThat(result).isEqualTo(ClassificationResultService.Disposition.REJECTED);
        assertThat(submission.getStatus()).isEqualTo(DocumentSubmissionStatus.PENDING_PROCESSING);
        verify(collectionRepository, never()).findBySlug(any());
        verify(agentClassificationRepository, never()).save(any());
    }

    @Test
    void retryableFailureLeavesSubmissionProcessingAndExhaustionDeadLettersRun() {
        ClassificationFailedEvent retryable = failedEvent(true, 1);

        ClassificationResultService.Disposition first = service.handleFailed(retryable);

        assertThat(first).isEqualTo(ClassificationResultService.Disposition.APPLIED);
        assertThat(run.getStatus()).isEqualTo(ClassificationRunStatus.FAILED);
        assertThat(submission.getStatus()).isEqualTo(DocumentSubmissionStatus.PENDING_PROCESSING);

        run.transitionTo(ClassificationRunStatus.QUEUED, NOW.plusSeconds(1));
        ReflectionTestUtils.setField(run, "attemptCount", 3);
        run.transitionTo(ClassificationRunStatus.RUNNING, NOW.plusSeconds(2));
        ClassificationFailedEvent exhausted = failedEvent(true, 3);

        ClassificationResultService.Disposition last = service.handleFailed(exhausted);

        assertThat(last).isEqualTo(ClassificationResultService.Disposition.APPLIED);
        assertThat(run.getStatus()).isEqualTo(ClassificationRunStatus.DEAD_LETTER);
        assertThat(submission.getStatus()).isEqualTo(DocumentSubmissionStatus.PENDING_PROCESSING);
    }

    private ClassificationCompletedEvent completedEvent() {
        return new ClassificationCompletedEvent(
                "v1", UUID.randomUUID(), "run-6101", DOCUMENT_ID, SUBMISSION_ID, MEDIA_ID,
                "ocr-model-v1", "recognized document text", true,
                List.of(new ClassificationCompletedEvent.Suggestion("cloud-computing", 0.92)),
                List.of(new ClassificationCompletedEvent.Suggestion("java", 0.81)),
                1, NOW);
    }

    private ClassificationCompletedEvent withCollectionSuggestion(String slug, double confidence) {
        ClassificationCompletedEvent event = completedEvent();
        return new ClassificationCompletedEvent(
                event.schemaVersion(), event.eventId(), event.classificationRunId(), event.documentId(),
                event.submissionId(), event.mediaId(), event.modelId(), event.ocrText(), event.ocrNeeded(),
                List.of(new ClassificationCompletedEvent.Suggestion(slug, confidence)),
                event.tagSuggestions(), event.attempt(), event.occurredAt());
    }

    private ClassificationFailedEvent failedEvent(boolean retryable, int attempt) {
        return new ClassificationFailedEvent(
                "v1", UUID.randomUUID(), "run-6101", DOCUMENT_ID, SUBMISSION_ID, MEDIA_ID,
                "OCR_UNAVAILABLE", "OCR could not process the document.", retryable, attempt, NOW);
    }

    private static DocumentSubmission readySubmission() {
        Media media = new Media();
        media.setId(MEDIA_ID);
        media.setStatus(MediaStatus.READY);
        media.setFileName("document.pdf");
        media.setMimeType("application/pdf");
        media.setSizeBytes(100);
        media.setObjectKey("documents/document.pdf");

        Document document = new Document();
        document.setId(DOCUMENT_ID);
        document.setMedia(media);

        DocumentSubmission submission = new DocumentSubmission();
        submission.setId(SUBMISSION_ID);
        submission.setDocument(document);
        submission.setStatus(DocumentSubmissionStatus.PENDING_PROCESSING);
        return submission;
    }

    private static Collection collection(String slug) {
        Collection collection = new Collection();
        collection.setId(UUID.randomUUID());
        collection.setSlug(slug);
        collection.setName(slug);
        return collection;
    }

    private static Tag tag(String slug) {
        Tag tag = new Tag();
        tag.setId(UUID.randomUUID());
        tag.setSlug(slug);
        tag.setName(slug);
        tag.setDescription(slug);
        return tag;
    }
}
