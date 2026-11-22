import type { TaxonomyCollection } from '@/features/taxonomy/taxonomy.type';

export interface DocumentFilterValue {
    search: string;
    collectionSlugs: string[];
    tagSlugs: string[];
}

export function createEmptyDocumentFilter(): DocumentFilterValue {
    return {
        search: '',
        collectionSlugs: [],
        tagSlugs: [],
    };
}

export function filterDocumentCollections(
    collections: TaxonomyCollection[],
    filters: DocumentFilterValue
): TaxonomyCollection[] {
    const query = filters.search.trim().toLocaleLowerCase();

    return collections.filter((collection) => {
        const matchesSearch =
            !query ||
            [
                collection.name,
                collection.slug,
                collection.description,
                ...collection.keywords,
            ]
                .join(' ')
                .toLocaleLowerCase()
                .includes(query);
        const matchesCollection =
            filters.collectionSlugs.length === 0 ||
            filters.collectionSlugs.includes(collection.slug);
        const matchesTag =
            filters.tagSlugs.length === 0 ||
            filters.tagSlugs.some((tagSlug) =>
                collection.tagSlugs.includes(tagSlug)
            );

        return matchesSearch && matchesCollection && matchesTag;
    });
}
