package com.cloudian.backend.modules.taxonomy;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.cloudian.backend.modules.taxonomy.dto.CollectionRequest;
import com.cloudian.backend.modules.taxonomy.dto.TagRequest;

import jakarta.validation.Validation;
import jakarta.validation.Validator;

class TaxonomyDtoValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void rejectsCollectionWithUppercaseSlug() {
        CollectionRequest request = new CollectionRequest(
                "Computing",
                "Technology documents",
                "Computer-Science",
                List.of());

        assertThat(validator.validate(request)).isNotEmpty();
    }

    @Test
    void rejectsTagWithBlankDescription() {
        TagRequest request = new TagRequest("Programming", "programming", " ");

        assertThat(validator.validate(request)).isNotEmpty();
    }
}
