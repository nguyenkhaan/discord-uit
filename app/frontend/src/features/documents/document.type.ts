export type DocumentSubmissionStatus =
    'PENDING_PROCESSING' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export type MediaStatus = 'QUARANTINED' | 'READY' | 'REJECTED' | 'DELETED';

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
