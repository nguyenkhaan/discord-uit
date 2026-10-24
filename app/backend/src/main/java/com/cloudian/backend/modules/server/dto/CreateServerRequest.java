package com.cloudian.backend.modules.server.dto;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Sent as multipart/form-data (not JSON) because it can carry a file:
 *   name  = text field
 *   image = optional file (PNG / JPEG / WEBP), checked by ImageUploadService
 */
public record CreateServerRequest(
        @NotBlank @Size(max = 100) String name,
        MultipartFile image
) {

    public boolean hasImage() {
        return image != null && !image.isEmpty();
    }
}