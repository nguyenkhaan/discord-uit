import type {
    AdminDocument,
    AdminDocumentStatus,
} from '@/features/documents/admin-document.type';

export const ALL_DOCUMENT_FILTER = 'ALL' as const;

export type AdminDocumentFilterValue = typeof ALL_DOCUMENT_FILTER | string;

export interface AdminDocumentFilter {
    collectionSlug: AdminDocumentFilterValue;
    tagSlug: AdminDocumentFilterValue;
    status: AdminDocumentStatus | typeof ALL_DOCUMENT_FILTER;
    search: string;
}

export function filterAdminDocuments(
    documents: AdminDocument[],
    filters: AdminDocumentFilter
): AdminDocument[] {
    const query = filters.search.trim().toLocaleLowerCase();

    return documents.filter((document) => {
        const matchesCollection =
            filters.collectionSlug === ALL_DOCUMENT_FILTER ||
            document.collectionSlugs.includes(filters.collectionSlug);
        const matchesTag =
            filters.tagSlug === ALL_DOCUMENT_FILTER ||
            document.tagSlugs.includes(filters.tagSlug);
        const matchesStatus =
            filters.status === ALL_DOCUMENT_FILTER ||
            document.status === filters.status;
        const matchesSearch =
            !query ||
            [document.title, document.slug, document.submittedBy]
                .join(' ')
                .toLocaleLowerCase()
                .includes(query);

        return (
            matchesCollection && matchesTag && matchesStatus && matchesSearch
        );
    });
}

export function formatDocumentStatus(status: AdminDocumentStatus): string {
    const labels: Record<AdminDocumentStatus, string> = {
        PENDING: 'Chờ duyệt',
        APPROVED: 'Đã duyệt',
        REJECTED: 'Đã từ chối',
    };

    return labels[status];
}
