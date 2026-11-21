package com.cloudian.backend.modules.document.dto;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Multipart form for the initial document upload; tags and collections are added later. */
public record UploadDocumentRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String description,
        @Size(max = 255) String slug,
        @NotNull MultipartFile file
) {
}
