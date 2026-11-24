package com.cloudian.backend.modules.document.messaging;

import org.springframework.stereotype.Component;

import com.cloudian.backend.models.ClassificationRun;
import com.cloudian.backend.models.DocumentSubmission;

/** Coordinates the classification run and outbox write inside the upload transaction. */
@Component
public class ClassificationEventWriter {

    public ClassificationRun enqueue(DocumentSubmission submission) {
        throw new UnsupportedOperationException("Classification enqueue is not implemented yet.");
    }
}
