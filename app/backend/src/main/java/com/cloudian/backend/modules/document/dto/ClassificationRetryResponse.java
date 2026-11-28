package com.cloudian.backend.modules.document.dto;

import com.cloudian.backend.commons.enums.ClassificationRunStatus;
import com.cloudian.backend.models.ClassificationRun;

public record ClassificationRetryResponse(
        String classificationRunId,
        ClassificationRunStatus status,
        int attemptCount) {

    public static ClassificationRetryResponse from(ClassificationRun run) {
        return new ClassificationRetryResponse(
                run.getClassificationRunId(),
                run.getStatus(),
                run.getAttemptCount());
    }
}
