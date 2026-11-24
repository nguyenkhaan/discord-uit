package com.cloudian.backend.modules.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.cloudian.backend.commons.enums.ClassificationRunStatus;
import com.cloudian.backend.commons.enums.MediaStatus;
import com.cloudian.backend.models.ClassificationRun;
import com.cloudian.backend.models.Document;
import com.cloudian.backend.models.DocumentSubmission;
import com.cloudian.backend.models.Media;
import com.cloudian.backend.modules.document.messaging.ClassificationCompletedEvent;
import com.cloudian.backend.modules.document.messaging.ClassificationFailedEvent;
import com.cloudian.backend.modules.document.messaging.ClassificationRequestedEvent;
import com.cloudian.backend.repositories.ClassificationRunRepository;

class ClassificationRunRepositoryTests {

    private static final UUID SUBMISSION_ID = UUID.fromString("00000000-0000-0000-0000-000000005001");
    private static final UUID MEDIA_ID = UUID.fromString("00000000-0000-0000-0000-000000005002");
    private static final Instant QUEUED_AT = Instant.parse("2026-11-24T08:00:00Z");

    @Test
    void queuesAReadyMediaForExactlyOneSubmissionAndMedia() {
        DocumentSubmission submission = submissionWithMedia(MediaStatus.READY);

        ClassificationRun run = ClassificationRun.queued(
                "classification-run-1",
                submission,
                submission.getDocument().getMedia(),
                QUEUED_AT);

        assertThat(run.getClassificationRunId()).isEqualTo("classification-run-1");
        assertThat(run.getDocumentSubmission()).isSameAs(submission);
        assertThat(run.getMedia()).isSameAs(submission.getDocument().getMedia());
        assertThat(run.getStatus()).isEqualTo(ClassificationRunStatus.QUEUED);
        assertThat(run.getAttemptCount()).isZero();
        assertThat(run.getQueuedAt()).isEqualTo(QUEUED_AT);
    }

    @Test
    void refusesToQueueMediaThatIsNotReady() {
        DocumentSubmission submission = submissionWithMedia(MediaStatus.SCANNING);

        assertThatThrownBy(() -> ClassificationRun.queued(
                "classification-run-1",
                submission,
                submission.getDocument().getMedia(),
                QUEUED_AT))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("READY");
    }

    @Test
    void permitsRetryableTransitionsButNotLeavingTerminalStates() {
        DocumentSubmission submission = submissionWithMedia(MediaStatus.READY);
        ClassificationRun run = ClassificationRun.queued(
                "classification-run-1",
                submission,
                submission.getDocument().getMedia(),
                QUEUED_AT);

        run.transitionTo(ClassificationRunStatus.RUNNING, QUEUED_AT.plusSeconds(1));
        run.transitionTo(ClassificationRunStatus.FAILED, QUEUED_AT.plusSeconds(2));
        run.transitionTo(ClassificationRunStatus.QUEUED, QUEUED_AT.plusSeconds(3));
        run.transitionTo(ClassificationRunStatus.RUNNING, QUEUED_AT.plusSeconds(4));
        run.transitionTo(ClassificationRunStatus.DEAD_LETTER, QUEUED_AT.plusSeconds(5));

        assertThat(run.getStatus()).isEqualTo(ClassificationRunStatus.DEAD_LETTER);
        assertThatThrownBy(() -> run.transitionTo(
                ClassificationRunStatus.QUEUED,
                QUEUED_AT.plusSeconds(6)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DEAD_LETTER");
    }

    @Test
    void exposesIdempotentRunLookups() throws NoSuchMethodException {
        assertThat(ClassificationRunRepository.class
                .getMethod("findByClassificationRunId", String.class))
                .isNotNull();
        assertThat(ClassificationRunRepository.class
                .getMethod("findByDocumentSubmission_Id", UUID.class))
                .isNotNull();
    }

    @Test
    void requestEventCarriesVersionedSafeInputAndImmutableTaxonomySnapshot() {
        ClassificationRequestedEvent event = new ClassificationRequestedEvent(
                "v1",
                UUID.fromString("00000000-0000-0000-0000-000000005101"),
                "classification-run-1",
                UUID.fromString("00000000-0000-0000-0000-000000005102"),
                SUBMISSION_ID,
                MEDIA_ID,
                new ClassificationRequestedEvent.FileMetadata("course.pdf", "application/pdf", 128L),
                new ClassificationRequestedEvent.SignedGetUrl(
                        "https://storage.example/signed",
                        Instant.parse("2026-11-24T08:15:00Z")),
                new ClassificationRequestedEvent.TaxonomySnapshot(
                        "taxonomy-2026-11-24",
                        List.of("cloud-computing"),
                        List.of("java")),
                1,
                QUEUED_AT);

        assertThat(event.schemaVersion()).isEqualTo("v1");
        assertThat(event.file().sizeBytes()).isEqualTo(128L);
        assertThat(event.signedGetUrl().expiresAt()).isAfter(QUEUED_AT);
        assertThat(event.taxonomy().collectionSlugs()).containsExactly("cloud-computing");
        assertThatThrownBy(() -> event.taxonomy().collectionSlugs().add("new-slug"))
                .isInstanceOf(UnsupportedOperationException.class);
    }

    @Test
    void completionAndFailureEventsCarryTheSameRunIdentity() {
        UUID eventId = UUID.fromString("00000000-0000-0000-0000-000000005201");
        UUID documentId = UUID.fromString("00000000-0000-0000-0000-000000005202");

        ClassificationCompletedEvent completed = new ClassificationCompletedEvent(
                "v1",
                eventId,
                "classification-run-1",
                documentId,
                SUBMISSION_ID,
                MEDIA_ID,
                "classifier-v1",
                "Extracted text",
                true,
                List.of(new ClassificationCompletedEvent.Suggestion("cloud-computing", 0.95)),
                List.of(new ClassificationCompletedEvent.Suggestion("java", 0.8)),
                1,
                QUEUED_AT);
        ClassificationFailedEvent failed = new ClassificationFailedEvent(
                "v1",
                UUID.fromString("00000000-0000-0000-0000-000000005203"),
                "classification-run-1",
                documentId,
                SUBMISSION_ID,
                MEDIA_ID,
                "OCR_TIMEOUT",
                "OCR timed out",
                true,
                1,
                QUEUED_AT);

        assertThat(completed.classificationRunId()).isEqualTo(failed.classificationRunId());
        assertThat(completed.collectionSuggestions()).hasSize(1);
        assertThat(failed.retryable()).isTrue();
    }

    private static DocumentSubmission submissionWithMedia(MediaStatus status) {
        Media media = readyMedia();
        media.setStatus(status);

        Document document = new Document();
        document.setId(UUID.randomUUID());
        document.setMedia(media);

        DocumentSubmission submission = new DocumentSubmission();
        submission.setId(SUBMISSION_ID);
        submission.setDocument(document);
        return submission;
    }

    private static Media readyMedia() {
        Media media = new Media();
        media.setId(MEDIA_ID);
        media.setStatus(MediaStatus.READY);
        return media;
    }
}
