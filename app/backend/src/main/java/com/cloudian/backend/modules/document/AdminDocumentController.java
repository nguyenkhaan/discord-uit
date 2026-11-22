package com.cloudian.backend.modules.document;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.cloudian.backend.modules.document.dto.DocumentPreviewResponse;
import com.cloudian.backend.modules.document.dto.DocumentReviewRequest;
import com.cloudian.backend.modules.document.dto.DocumentSubmissionResponse;
import com.cloudian.backend.modules.document.dto.DocumentUploadResponse;
import com.cloudian.backend.security.CustomUserDetails;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/admin/documents")
@PreAuthorize("hasRole('ADMIN')")
public class AdminDocumentController {

    private final DocumentService documentService;

    @GetMapping("/submissions")
    public List<DocumentSubmissionResponse> listSubmissions() {
        return documentService.listAdminSubmissions();
    }

    @GetMapping("/submissions/{submissionId}/preview-url")
    public DocumentPreviewResponse preview(@PathVariable("submissionId") UUID submissionId) {
        return documentService.previewSubmission(submissionId);
    }

    @PostMapping("/submissions/{submissionId}/review")
    public DocumentUploadResponse review(
            @AuthenticationPrincipal CustomUserDetails principal,
            @PathVariable("submissionId") UUID submissionId,
            @Valid @RequestBody DocumentReviewRequest request) {
        return documentService.review(principal.getUserId(), submissionId, request);
    }
}
