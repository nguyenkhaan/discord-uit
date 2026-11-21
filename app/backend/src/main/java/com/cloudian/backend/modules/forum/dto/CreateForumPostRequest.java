package com.cloudian.backend.modules.forum.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** content là chuỗi JSON của trình soạn Tiptap */
public record CreateForumPostRequest(
        @NotBlank @Size(max = 200) String title,
        @NotBlank String content,
        @Size(max = 5) List<String> topics,
        @NotNull Boolean anonymous) {
}
