export type DocumentSubmissionStatus =
    'PENDING_PROCESSING' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export type MediaStatus = 'QUARANTINED' | 'READY' | 'REJECTED' | 'DELETED';

export type ClassificationRunStatus =
    | 'QUEUED'
    | 'RUNNING'
    | 'SUCCEEDED'
    | 'FAILED'
    | 'DEAD_LETTER';

export interface ClassificationSuggestion {
    slug: string;
    confidence: number;
}

export interface AdminDocumentClassification {
    classificationRunId: string | null;
    status: ClassificationRunStatus | null;
    attemptCount: number;
    modelId: string | null;
    ocrNeeded: boolean;
    ocrText: string | null;
    failureCode: string | null;
    failureMessage: string | null;
    queuedAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string | null;
    collectionSuggestions: ClassificationSuggestion[];
    tagSuggestions: ClassificationSuggestion[];
}

export interface ClassificationRetryResult {
    classificationRunId: string;
    status: ClassificationRunStatus;
    attemptCount: number;
}

export interface DocumentSubmission {
    documentId: string;
    submissionId: string;
    title: string;
    description: string | null;
    slug: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    collectionSlugs: string[];
    tagSlugs: string[];
    submittedBy: string | null;
    visibilityStatus: 'HIDDEN' | 'PUBLIC' | 'REMOVED';
    mediaStatus: MediaStatus;
    submissionStatus: DocumentSubmissionStatus;
    submittedAt: string;
    reviewedAt: string | null;
    rejectionReason: string | null;
}

export interface DocumentPreview {
    documentId: string;
    submissionId: string;
    title: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    submissionStatus: DocumentSubmissionStatus;
    previewUrl: string;
    downloadUrl: string;
}

export interface DocumentTaxonomyUpdateInput {
    documentId: string;
    collectionSlugs: string[];
    tagSlugs: string[];
}

export interface DocumentTaxonomyResponse {
    documentId: string;
    collectionSlugs: string[];
    tagSlugs: string[];
}

export interface UploadDocumentInput {
    title: string;
    description?: string;
    slug?: string;
    file: File;
    tagSlugs: string[];
}

export interface UploadProgress {
    loaded: number;
    total: number;
    percentage: number;
}

export interface DocumentUploadResult {
    documentId: string;
    submissionId: string;
    mediaId: string;
    title: string;
    slug: string;
    description: string | null;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    visibilityStatus: 'HIDDEN' | 'PUBLIC' | 'REMOVED';
    mediaStatus: MediaStatus;
    submissionStatus: DocumentSubmissionStatus;
    submittedAt: string;
}
