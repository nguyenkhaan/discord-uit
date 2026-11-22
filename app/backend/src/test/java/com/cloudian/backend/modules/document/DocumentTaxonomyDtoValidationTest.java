package com.cloudian.backend.modules.document;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.cloudian.backend.modules.document.dto.DocumentTaxonomyUpdateRequest;

import jakarta.validation.Validation;
import jakarta.validation.Validator;

class DocumentTaxonomyDtoValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void acceptsCatalogSlugsUpTo255Characters() {
        String slug = "a".repeat(255);
        DocumentTaxonomyUpdateRequest request = new DocumentTaxonomyUpdateRequest(
                List.of(slug),
                List.of(slug));

        assertThat(validator.validate(request)).isEmpty();
    }
}
