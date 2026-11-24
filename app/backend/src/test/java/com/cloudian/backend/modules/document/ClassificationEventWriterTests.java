package com.cloudian.backend.modules.document;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.test.util.ReflectionTestUtils;

import com.cloudian.backend.commons.enums.DocumentSubmissionStatus;
import com.cloudian.backend.commons.enums.MediaStatus;
import com.cloudian.backend.commons.enums.OutboxStatus;
import com.cloudian.backend.models.ClassificationRun;
import com.cloudian.backend.models.Collection;
import com.cloudian.backend.models.Document;
import com.cloudian.backend.models.DocumentSubmission;
import com.cloudian.backend.models.Media;
import com.cloudian.backend.models.OutboxEvent;
import com.cloudian.backend.models.Tag;
import com.cloudian.backend.modules.document.messaging.ClassificationEventWriter;
import com.cloudian.backend.repositories.ClassificationRunRepository;
import com.cloudian.backend.repositories.CollectionRepository;
import com.cloudian.backend.repositories.OutboxEventRepository;
import com.cloudian.backend.repositories.TagRepository;
import com.cloudian.backend.services.StorageService;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@ExtendWith(MockitoExtension.class)
class ClassificationEventWriterTests {

    private static final UUID SUBMISSION_ID = UUID.fromString("00000000-0000-0000-0000-000000006001");
    private static final UUID DOCUMENT_ID = UUID.fromString("00000000-0000-0000-0000-000000006002");
    private static final UUID MEDIA_ID = UUID.fromString("00000000-0000-0000-0000-000000006003");
    private static final Instant EXPIRES_AT = Instant.parse("2026-11-24T08:15:00Z");

    @Mock
    private ClassificationRunRepository classificationRunRepository;

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @Mock
    private CollectionRepository collectionRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private StorageService storageService;

    @Test
    void writesOneRequestOutboxWithSignedUrlAndTaxonomySnapshot() throws Exception {
        DocumentSubmission submission = readySubmission();
        Collection collection = collection("cloud-computing");
        Tag tag = tag("java");
        when(classificationRunRepository.findByDocumentSubmission_Id(SUBMISSION_ID))
                .thenReturn(Optional.empty());
        when(collectionRepository.findAll(any(Sort.class))).thenReturn(List.of(collection));
        when(tagRepository.findAll(any(Sort.class))).thenReturn(List.of(tag));
        when(storageService.presignedGetUrl("documents/course.pdf")).thenReturn("https://storage.example/signed");
        when(storageService.presignedGetUrlExpiresAt()).thenReturn(EXPIRES_AT);
        when(classificationRunRepository.save(any(ClassificationRun.class))).thenAnswer(invocation -> {
            ClassificationRun run = invocation.getArgument(0);
            ReflectionTestUtils.setField(run, "id", UUID.fromString("00000000-0000-0000-0000-000000006004"));
            return run;
        });
        JsonMapper jsonMapper = JsonMapper.builder().build();
        ClassificationEventWriter writer = writer(jsonMapper);

        ClassificationRun run = writer.enqueue(submission);

        assertThat(run.getAttemptCount()).isEqualTo(1);
        assertThat(run.getClassificationRunId()).isNotBlank();
        ArgumentCaptor<OutboxEvent> outboxCaptor = ArgumentCaptor.forClass(OutboxEvent.class);
        verify(outboxEventRepository).save(outboxCaptor.capture());
        OutboxEvent outbox = outboxCaptor.getValue();
        assertThat(outbox.getEntityId()).isEqualTo(run.getId());
        assertThat(outbox.getEventType()).isEqualTo("DOCUMENT_CLASSIFICATION_REQUESTED_V1");
        assertThat(outbox.getStatus()).isEqualTo(OutboxStatus.PENDING);

        JsonNode payload = jsonMapper.readTree(outbox.getPayload());
        assertThat(payload.get("schemaVersion").stringValue()).isEqualTo("v1");
        assertThat(payload.get("classificationRunId").stringValue())
                .isEqualTo(run.getClassificationRunId());
        assertThat(payload.get("signedGetUrl").get("value").stringValue())
                .isEqualTo("https://storage.example/signed");
        assertThat(payload.get("signedGetUrl").get("expiresAt").stringValue())
                .isEqualTo(EXPIRES_AT.toString());
        assertThat(payload.get("taxonomy").get("collectionSlugs").get(0).stringValue())
                .isEqualTo("cloud-computing");
        assertThat(payload.get("taxonomy").get("tagSlugs").get(0).stringValue())
                .isEqualTo("java");
        assertThat(payload.get("objectKey")).isNull();
    }

    @Test
    void returnsExistingRunWithoutCreatingAnotherOutboxEvent() {
        DocumentSubmission submission = readySubmission();
        ClassificationRun existing = ClassificationRun.queued(
                "existing-run",
                submission,
                submission.getDocument().getMedia(),
                Instant.parse("2026-11-24T08:00:00Z"));
        when(classificationRunRepository.findByDocumentSubmission_Id(SUBMISSION_ID))
                .thenReturn(Optional.of(existing));

        ClassificationRun result = writer(JsonMapper.builder().build()).enqueue(submission);

        assertThat(result).isSameAs(existing);
        verifyNoInteractions(outboxEventRepository, collectionRepository, tagRepository, storageService);
    }

    private ClassificationEventWriter writer(JsonMapper jsonMapper) {
        return new ClassificationEventWriter(
                classificationRunRepository,
                outboxEventRepository,
                collectionRepository,
                tagRepository,
                storageService,
                jsonMapper);
    }

    private static DocumentSubmission readySubmission() {
        Media media = new Media();
        media.setId(MEDIA_ID);
        media.setObjectKey("documents/course.pdf");
        media.setFileName("course.pdf");
        media.setMimeType("application/pdf");
        media.setSizeBytes(128);
        media.setStatus(MediaStatus.READY);

        Document document = new Document();
        document.setId(DOCUMENT_ID);
        document.setMedia(media);

        DocumentSubmission submission = new DocumentSubmission();
        submission.setId(SUBMISSION_ID);
        submission.setDocument(document);
        submission.setStatus(DocumentSubmissionStatus.PENDING_PROCESSING);
        submission.setSubmittedAt(Instant.parse("2026-11-24T08:00:00Z"));
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
