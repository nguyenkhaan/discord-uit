export type TaxonomyKind = 'collection' | 'tag';

export interface TaxonomyCollection {
    id: string;
    name: string;
    slug: string;
    description: string;
    keywords: string[];
    documentCount: number;
    classificationCount: number;
    tagSlugs: string[];
    updatedAt: string;
}

export interface TaxonomyTag {
    id: string;
    name: string;
    slug: string;
    description: string;
    documentCount: number;
    classificationCount: number;
    updatedAt: string;
}

export interface TaxonomyFormValues {
    name: string;
    slug: string;
    description: string;
    keywords: string[];
}

export type TaxonomyItem = TaxonomyCollection | TaxonomyTag;
