package com.cloudian.backend.modules.document.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record DocumentUploadInitRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String description,
        @Size(max = 255) String slug,
        @NotBlank @Size(max = 255) String fileName,
        @NotBlank @Size(max = 120) String mimeType,
        @NotNull @Positive Long sizeBytes,
        List<@NotBlank @Size(max = 100) String> tagSlugs
) {
}
