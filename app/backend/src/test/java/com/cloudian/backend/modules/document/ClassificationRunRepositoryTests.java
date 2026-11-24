package com.cloudian.backend.modules.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.cloudian.backend.commons.enums.ClassificationRunStatus;
import com.cloudian.backend.commons.enums.MediaStatus;
import com.cloudian.backend.models.ClassificationRun;
import com.cloudian.backend.models.Document;
import com.cloudian.backend.models.DocumentSubmission;
import com.cloudian.backend.models.Media;
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
