package com.cloudian.backend.modules.document;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.document.dto.DocumentUploadResponse;
import com.cloudian.backend.modules.document.dto.UploadDocumentRequest;
import com.cloudian.backend.security.CustomUserDetails;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentUploadResponse upload(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @ModelAttribute UploadDocumentRequest request) {
        return documentService.upload(principal.getUserId(), request);
    }
}
