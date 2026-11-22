package com.cloudian.backend.modules.forum.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Không đổi được chế độ ẩn danh sau khi đăng */
public record UpdateForumPostRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String content,
        @Size(max = 5) List<String> topics) {
}
