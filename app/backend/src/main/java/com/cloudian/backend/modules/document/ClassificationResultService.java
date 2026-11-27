package com.cloudian.backend.modules.document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cloudian.backend.commons.enums.ClassificationRunStatus;
import com.cloudian.backend.commons.enums.DocumentSubmissionStatus;
import com.cloudian.backend.commons.enums.MediaStatus;
import com.cloudian.backend.models.AgentClassification;
import com.cloudian.backend.models.AgentClassificationCollection;
import com.cloudian.backend.models.AgentClassificationTag;
import com.cloudian.backend.models.ClassificationRun;
import com.cloudian.backend.models.Collection;
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

@Service
public class ClassificationResultService {

    private static final Pattern SAFE_SLUG = Pattern.compile("[a-z0-9]+(?:-[a-z0-9]+)*");
    private static final int MAX_MODEL_ID_LENGTH = 255;
    private static final int MAX_OCR_TEXT_LENGTH = 200_000;
    private static final int MAX_COLLECTION_SUGGESTIONS = 20;
    private static final int MAX_TAG_SUGGESTIONS = 30;

    private final ClassificationRunRepository classificationRunRepository;
    private final DocumentSubmissionRepository documentSubmissionRepository;
    private final AgentClassificationRepository agentClassificationRepository;
    private final AgentClassificationCollectionRepository collectionLinkRepository;
    private final AgentClassificationTagRepository tagLinkRepository;
    private final CollectionRepository collectionRepository;
    private final TagRepository tagRepository;
    private final int maxAttempts;

    public ClassificationResultService(
            ClassificationRunRepository classificationRunRepository,
            DocumentSubmissionRepository documentSubmissionRepository,
            AgentClassificationRepository agentClassificationRepository,
            AgentClassificationCollectionRepository collectionLinkRepository,
            AgentClassificationTagRepository tagLinkRepository,
            CollectionRepository collectionRepository,
            TagRepository tagRepository,
            @Value("${app.classification.max-attempts:3}") int maxAttempts) {
        if (maxAttempts < 1) {
            throw new IllegalArgumentException("maxAttempts must be positive.");
        }
        this.classificationRunRepository = classificationRunRepository;
        this.documentSubmissionRepository = documentSubmissionRepository;
        this.agentClassificationRepository = agentClassificationRepository;
        this.collectionLinkRepository = collectionLinkRepository;
        this.tagLinkRepository = tagLinkRepository;
        this.collectionRepository = collectionRepository;
        this.tagRepository = tagRepository;
        this.maxAttempts = maxAttempts;
    }

    @Transactional
    public Disposition handleCompleted(ClassificationCompletedEvent event) {
        ClassificationRun run = classificationRunRepository
                .findByClassificationRunIdForUpdate(event.classificationRunId())
                .orElse(null);
        if (!isCurrentAttempt(run, event.attempt())
                || run.getStatus() == ClassificationRunStatus.SUCCEEDED
                || run.getStatus() == ClassificationRunStatus.DEAD_LETTER) {
            return Disposition.IGNORED;
        }

        DocumentSubmission submission = findCurrentSubmission(
                run, event.documentId(), event.submissionId(), event.mediaId());
        if (!isProcessable(run, submission)) {
            return Disposition.IGNORED;
        }

        try {
            validateCompletedEvent(event);
            List<Collection> collections = resolveCollections(event.collectionSuggestions());
            List<Tag> tags = resolveTags(event.tagSuggestions());
            persistSuccessfulResult(run, submission, event, collections, tags);
            return Disposition.APPLIED;
        } catch (InvalidResultException exception) {
            failInvalidResult(run);
            return Disposition.REJECTED;
        }
    }

    @Transactional
    public Disposition handleFailed(ClassificationFailedEvent event) {
        ClassificationRun run = classificationRunRepository
                .findByClassificationRunIdForUpdate(event.classificationRunId())
                .orElse(null);
        if (!isCurrentAttempt(run, event.attempt())
                || run.getStatus() == ClassificationRunStatus.SUCCEEDED
                || run.getStatus() == ClassificationRunStatus.DEAD_LETTER) {
            return Disposition.IGNORED;
        }

        DocumentSubmission submission = findCurrentSubmission(
                run, event.documentId(), event.submissionId(), event.mediaId());
        if (!isProcessable(run, submission) || !"v1".equals(event.schemaVersion())) {
            return Disposition.IGNORED;
        }

        boolean mayRetry = event.retryable() && event.attempt() < maxAttempts;
        run.setFailure(safeFailureCode(event.failureCode()), "Classification processing failed.");
        run.transitionTo(
                mayRetry ? ClassificationRunStatus.FAILED : ClassificationRunStatus.DEAD_LETTER,
                Instant.now());
        classificationRunRepository.save(run);
        return Disposition.APPLIED;
    }

    private DocumentSubmission findCurrentSubmission(
            ClassificationRun run,
            UUID documentId,
            UUID submissionId,
            UUID mediaId) {
        if (run == null
                || run.getDocumentSubmission() == null
                || !sameId(run.getDocumentSubmission().getId(), submissionId)
                || run.getDocumentSubmission().getDocument() == null
                || !sameId(run.getDocumentSubmission().getDocument().getId(), documentId)
                || run.getMedia() == null
                || !sameId(run.getMedia().getId(), mediaId)) {
            return null;
        }
        return documentSubmissionRepository.findByIdForUpdate(submissionId).orElse(null);
    }

    private boolean isProcessable(ClassificationRun run, DocumentSubmission submission) {
        if (run == null || submission == null
                || submission.getStatus() != DocumentSubmissionStatus.PENDING_PROCESSING
                || (run.getStatus() != ClassificationRunStatus.QUEUED
                    && run.getStatus() != ClassificationRunStatus.RUNNING)) {
            return false;
        }
        Media runMedia = run.getMedia();
        Media documentMedia = submission.getDocument() == null ? null : submission.getDocument().getMedia();
        return runMedia != null
                && runMedia.getStatus() == MediaStatus.READY
                && documentMedia != null
                && sameId(runMedia.getId(), documentMedia.getId());
    }

    private boolean isCurrentAttempt(ClassificationRun run, int eventAttempt) {
        return run != null && run.getAttemptCount() == eventAttempt;
    }

    private void validateCompletedEvent(ClassificationCompletedEvent event) {
        if (!"v1".equals(event.schemaVersion())
                || event.modelId() == null || event.modelId().isBlank() || event.modelId().length() > MAX_MODEL_ID_LENGTH
                || event.ocrText() == null || event.ocrText().isBlank()
                || event.ocrText().length() > MAX_OCR_TEXT_LENGTH
                || event.collectionSuggestions() == null
                || event.collectionSuggestions().size() > MAX_COLLECTION_SUGGESTIONS
                || event.tagSuggestions() == null
                || event.tagSuggestions().size() > MAX_TAG_SUGGESTIONS) {
            throw invalidResult();
        }
        validateSuggestions(event.collectionSuggestions());
        validateSuggestions(event.tagSuggestions());
    }

    private void validateSuggestions(List<ClassificationCompletedEvent.Suggestion> suggestions) {
        Set<String> seen = new HashSet<>();
        for (ClassificationCompletedEvent.Suggestion suggestion : suggestions) {
            if (suggestion == null
                    || suggestion.slug() == null
                    || suggestion.slug().length() > 255
                    || !SAFE_SLUG.matcher(suggestion.slug()).matches()
                    || !Double.isFinite(suggestion.confidence())
                    || suggestion.confidence() < 0.0
                    || suggestion.confidence() > 1.0
                    || !seen.add(suggestion.slug())) {
                throw invalidResult();
            }
        }
    }

    private List<Collection> resolveCollections(List<ClassificationCompletedEvent.Suggestion> suggestions) {
        List<Collection> resolved = new ArrayList<>(suggestions.size());
        for (ClassificationCompletedEvent.Suggestion suggestion : suggestions) {
            resolved.add(collectionRepository.findBySlug(suggestion.slug())
                    .orElseThrow(ClassificationResultService::invalidResult));
        }
        return resolved;
    }

    private List<Tag> resolveTags(List<ClassificationCompletedEvent.Suggestion> suggestions) {
        List<Tag> resolved = new ArrayList<>(suggestions.size());
        for (ClassificationCompletedEvent.Suggestion suggestion : suggestions) {
            resolved.add(tagRepository.findBySlug(suggestion.slug())
                    .orElseThrow(ClassificationResultService::invalidResult));
        }
        return resolved;
    }

    private void persistSuccessfulResult(
            ClassificationRun run,
            DocumentSubmission submission,
            ClassificationCompletedEvent event,
            List<Collection> collections,
            List<Tag> tags) {
        AgentClassification classification = new AgentClassification();
        classification.setDocumentSubmission(submission);
        classification.setClassificationRunId(run.getClassificationRunId());
        classification.setModelId(event.modelId());
        classification.setOcrText(event.ocrText());
        classification = agentClassificationRepository.save(classification);

        List<AgentClassificationCollection> collectionLinks = new ArrayList<>(collections.size());
        for (int index = 0; index < collections.size(); index++) {
            AgentClassificationCollection link = new AgentClassificationCollection();
            link.setAgentClassification(classification);
            link.setCollection(collections.get(index));
            link.setConfidence(event.collectionSuggestions().get(index).confidence());
            collectionLinks.add(link);
        }
        if (!collectionLinks.isEmpty()) {
            collectionLinkRepository.saveAll(collectionLinks);
        }

        List<AgentClassificationTag> tagLinks = new ArrayList<>(tags.size());
        for (int index = 0; index < tags.size(); index++) {
            AgentClassificationTag link = new AgentClassificationTag();
            link.setAgentClassification(classification);
            link.setTag(tags.get(index));
            link.setConfidence(event.tagSuggestions().get(index).confidence());
            tagLinks.add(link);
        }
        if (!tagLinks.isEmpty()) {
            tagLinkRepository.saveAll(tagLinks);
        }

        run.setModelId(event.modelId());
        run.setOcrNeeded(event.ocrNeeded());
        run.setFailure(null, null);
        if (run.getStatus() == ClassificationRunStatus.QUEUED) {
            run.transitionTo(ClassificationRunStatus.RUNNING, Instant.now());
        }
        run.transitionTo(ClassificationRunStatus.SUCCEEDED, Instant.now());
        submission.setStatus(DocumentSubmissionStatus.PENDING_REVIEW);
        classificationRunRepository.save(run);
        documentSubmissionRepository.save(submission);
    }

    private void failInvalidResult(ClassificationRun run) {
        boolean mayRetry = run.getAttemptCount() < maxAttempts;
        run.setFailure("INVALID_RESULT", "Classification result failed backend validation.");
        run.transitionTo(
                mayRetry ? ClassificationRunStatus.FAILED : ClassificationRunStatus.DEAD_LETTER,
                Instant.now());
        classificationRunRepository.save(run);
    }

    private static String safeFailureCode(String failureCode) {
        return failureCode != null && failureCode.matches("[A-Z0-9_]{1,80}")
                ? failureCode
                : "WORKER_FAILURE";
    }

    private static boolean sameId(UUID first, UUID second) {
        return first != null && first.equals(second);
    }

    private static InvalidResultException invalidResult() {
        return new InvalidResultException();
    }

    private static final class InvalidResultException extends RuntimeException {
    }

    public enum Disposition {
        APPLIED,
        IGNORED,
        REJECTED
    }
}
