package com.cloudian.backend.modules.document;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.document.dto.DocumentUploadResponse;
import com.cloudian.backend.modules.document.dto.DocumentUploadInitRequest;
import com.cloudian.backend.modules.document.dto.DocumentUploadInitResponse;
import com.cloudian.backend.modules.document.dto.DocumentSubmissionResponse;
import com.cloudian.backend.modules.document.dto.UploadDocumentRequest;
import com.cloudian.backend.security.CustomUserDetails;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(path = "/upload-init", consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentUploadInitResponse initUpload(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody DocumentUploadInitRequest request) {
        return documentService.initUpload(principal.getUserId(), request);
    }

    @PostMapping("/{submissionId}/complete")
    public DocumentUploadResponse completeUpload(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable("submissionId") UUID submissionId) {
        return documentService.completeUpload(principal.getUserId(), submissionId);
    }

    @GetMapping("/my-submissions")
    public List<DocumentSubmissionResponse> listMySubmissions(
            @AuthenticationPrincipal CustomUserDetails principal) {
        return documentService.listMySubmissions(principal.getUserId());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentUploadResponse upload(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @ModelAttribute UploadDocumentRequest request) {
        return documentService.upload(principal.getUserId(), request);
    }
}
