package com.cloudian.backend.modules.server.dto;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

class CreateServerRequestValidationTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void rejectsADescriptionLongerThan500Characters() {
        CreateServerRequest request = new CreateServerRequest(
                "Cloud Computing",
                "x".repeat(501),
                null);

        assertThat(validator.validate(request))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("description");
    }
}
