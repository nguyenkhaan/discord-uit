import axios from 'axios';

import { privateClient } from '@/api/client';
import type {
    DocumentPreview,
    DocumentSubmission,
    DocumentTaxonomyResponse,
    DocumentTaxonomyUpdateInput,
    DocumentUploadResult,
    UploadDocumentInput,
    UploadProgress,
} from '@/features/documents/document.type';

interface UploadInitResponse {
    documentId: string;
    submissionId: string;
    mediaId: string;
    uploadUrl: string;
    uploadUrlExpiresAt: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    visibilityStatus: DocumentUploadResult['visibilityStatus'];
    mediaStatus: DocumentUploadResult['mediaStatus'];
    submissionStatus: DocumentUploadResult['submissionStatus'];
}

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

export function validateDocumentFile(file: File): string | null {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['pdf', 'docx', 'pptx', 'txt'].includes(extension)) {
        return 'Chỉ hỗ trợ file PDF, DOCX, PPTX hoặc TXT.';
    }
    if (file.size <= 0 || file.size > MAX_UPLOAD_SIZE_BYTES) {
        return 'Kích thước file phải từ 1 byte đến 5 MB.';
    }
    if (!file.type) {
        return 'Không xác định được MIME type của file.';
    }
    return null;
}

async function putWithRetry(
    uploadUrl: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
): Promise<void> {
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            await axios.put(uploadUrl, file, {
                headers: { 'Content-Type': file.type },
                onUploadProgress: (event) => {
                    const total = event.total ?? file.size;
                    onProgress?.({
                        loaded: event.loaded,
                        total,
                        percentage: Math.min(
                            100,
                            Math.round((event.loaded / total) * 100)
                        ),
                    });
                },
            });
            return;
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError instanceof Error
        ? lastError
        : new Error('Không thể tải file lên storage.');
}

export async function uploadDocument(
    input: UploadDocumentInput,
    onProgress?: (progress: UploadProgress) => void
): Promise<DocumentUploadResult> {
    const fileError = validateDocumentFile(input.file);
    if (fileError) throw new Error(fileError);

    const init = await privateClient.post<UploadInitResponse>(
        '/documents/upload-init',
        {
            title: input.title,
            description: input.description || undefined,
            slug: input.slug || undefined,
            fileName: input.file.name,
            mimeType: input.file.type,
            sizeBytes: input.file.size,
            tagSlugs: input.tagSlugs,
        }
    );

    await putWithRetry(init.data.uploadUrl, input.file, onProgress);
    const complete = await privateClient.post<DocumentUploadResult>(
        `/documents/${init.data.submissionId}/complete`
    );
    return complete.data;
}

export async function listMySubmissions(): Promise<DocumentSubmission[]> {
    const response = await privateClient.get<DocumentSubmission[]>(
        '/documents/my-submissions'
    );
    return response.data;
}

export async function listAdminSubmissions(): Promise<DocumentSubmission[]> {
    const response = await privateClient.get<DocumentSubmission[]>(
        '/admin/documents/submissions'
    );
    return response.data;
}

export async function getAdminDocumentPreview(
    submissionId: string
): Promise<DocumentPreview> {
    const response = await privateClient.get<DocumentPreview>(
        `/admin/documents/submissions/${submissionId}/preview-url`
    );
    return response.data;
}

export async function updateAdminDocumentTaxonomy(
    documentId: string,
    input: Omit<DocumentTaxonomyUpdateInput, 'documentId'>
): Promise<DocumentTaxonomyResponse> {
    const response = await privateClient.patch<DocumentTaxonomyResponse>(
        `/admin/documents/${documentId}/taxonomy`,
        input
    );
    return response.data;
}

export async function reviewAdminDocument({
    submissionId,
    decision,
    rejectionReason,
}: {
    submissionId: string;
    decision: 'APPROVED' | 'REJECTED';
    rejectionReason?: string;
}): Promise<DocumentUploadResult> {
    const response = await privateClient.post<DocumentUploadResult>(
        `/admin/documents/submissions/${submissionId}/review`,
        { decision, rejectionReason: rejectionReason || undefined }
    );
    return response.data;
}
