import type { TaxonomyCollection } from '@/features/taxonomy/taxonomy.type';

export type DocumentCatalogSort = 'newest' | 'name' | 'documents';

export interface DocumentCollectionPage {
    items: TaxonomyCollection[];
    page: number;
    pageCount: number;
    total: number;
}

export function sortDocumentCollections(
    collections: TaxonomyCollection[],
    sort: DocumentCatalogSort
): TaxonomyCollection[] {
    return [...collections].sort((left, right) => {
        if (sort === 'name') {
            return left.name.localeCompare(right.name, 'vi');
        }

        if (sort === 'documents') {
            return (
                right.documentCount - left.documentCount ||
                left.name.localeCompare(right.name, 'vi')
            );
        }

        return (
            parseDate(right.updatedAt) - parseDate(left.updatedAt) ||
            left.name.localeCompare(right.name, 'vi')
        );
    });
}

export function paginateDocumentCollections(
    collections: TaxonomyCollection[],
    page: number,
    pageSize: number
): DocumentCollectionPage {
    const normalizedPageSize = Math.max(1, Math.floor(pageSize));
    const pageCount = Math.max(
        1,
        Math.ceil(collections.length / normalizedPageSize)
    );
    const normalizedPage = Math.min(
        pageCount,
        Math.max(1, Math.floor(Number.isFinite(page) ? page : 1))
    );
    const start = (normalizedPage - 1) * normalizedPageSize;

    return {
        items: collections.slice(start, start + normalizedPageSize),
        page: normalizedPage,
        pageCount,
        total: collections.length,
    };
}

function parseDate(value: string): number {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? 0 : timestamp;
}
