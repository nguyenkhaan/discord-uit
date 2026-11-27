package com.cloudian.backend.models;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import com.cloudian.backend.commons.enums.ClassificationJobStatus;

import jakarta.persistence.Table;

class ClassificationJobMappingTests {

    @Test
    void mapsThePersistentWorkerJobStateToTheClassificationJobTable() {
        Table table = ClassificationJob.class.getAnnotation(Table.class);

        assertThat(table.name()).isEqualTo("classification_job");
        assertThat(ClassificationJobStatus.PROCESSING.name()).isEqualTo("PROCESSING");
        assertThat(ClassificationJobStatus.RESULT_PENDING.name()).isEqualTo("RESULT_PENDING");
        assertThat(ClassificationJobStatus.PUBLISHED.name()).isEqualTo("PUBLISHED");
    }
}
