export type AdminDocumentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type AdminDocumentPreviewKind = 'HTML' | 'DOCX' | 'PDF';

export interface AdminDocument {
    id: string;
    title: string;
    slug: string;
    summary: string;
    collectionSlugs: string[];
    tagSlugs: string[];
    status: AdminDocumentStatus;
    submittedBy: string;
    submittedAt: string;
    fileName: string;
    fileType: AdminDocumentPreviewKind;
    fileSize: string;
    pageCount: number;
    version: number;
    previewKind: AdminDocumentPreviewKind;
    previewHtml: string;
}
