import { privateClient, publicClient } from '@/api/client';
import type { components } from '@/contract/api-contract';
import type {
    TaxonomyCollection,
    TaxonomyFormValues,
    TaxonomyTag,
} from '@/features/taxonomy/taxonomy.type';

export interface TaxonomyListParams {
    page?: number;
    size?: number;
    query?: string;
}

export interface TaxonomyPage<T> {
    items: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

type ApiCollectionResponse = components['schemas']['CollectionResponse'];
type ApiTagResponse = components['schemas']['TagResponse'];
type ApiCollectionPage = Omit<
    components['schemas']['TaxonomyListResponseCollectionResponse'],
    'items'
> & { items?: ApiCollectionResponse[] };
type ApiTagPage = Omit<
    components['schemas']['TaxonomyListResponseTagResponse'],
    'items'
> & { items?: ApiTagResponse[] };

const COLLECTIONS_ENDPOINT = '/collections';
const TAGS_ENDPOINT = '/tags';

function required(value: string | undefined, field: string): string {
    if (!value) throw new Error(`Taxonomy response is missing ${field}.`);
    return value;
}

function mapCollection(item: ApiCollectionResponse): TaxonomyCollection {
    return {
        id: required(item.id, 'collection id'),
        name: required(item.name, 'collection name'),
        slug: required(item.slug, 'collection slug'),
        description: item.description ?? '',
        keywords: item.keywords ?? [],
        documentCount: item.documentCount ?? 0,
        classificationCount: item.classificationCount ?? 0,
        tagSlugs: item.tagSlugs ?? [],
        updatedAt: item.updatedAt ?? item.createdAt ?? '',
    };
}

function mapTag(item: ApiTagResponse): TaxonomyTag {
    return {
        id: required(item.id, 'tag id'),
        name: required(item.name, 'tag name'),
        slug: required(item.slug, 'tag slug'),
        description: item.description ?? '',
        documentCount: item.documentCount ?? 0,
        classificationCount: item.classificationCount ?? 0,
        updatedAt: '',
    };
}

function mapPage<TApi, TUi>(
    response: { items?: TApi[]; page?: number; size?: number; totalElements?: number; totalPages?: number },
    mapper: (item: TApi) => TUi
): TaxonomyPage<TUi> {
    return {
        items: (response.items ?? []).map(mapper),
        page: response.page ?? 0,
        size: response.size ?? 20,
        totalElements: response.totalElements ?? 0,
        totalPages: response.totalPages ?? 0,
    };
}

export async function listAdminCollections(
    params: TaxonomyListParams = {}
): Promise<TaxonomyPage<TaxonomyCollection>> {
    const response = await privateClient.get<ApiCollectionPage>(
        '/admin/collections',
        { params }
    );
    return mapPage(response.data, mapCollection);
}

export async function getAdminCollection(id: string): Promise<TaxonomyCollection> {
    const response = await privateClient.get<ApiCollectionResponse>(
        `/admin/collections/${id}`
    );
    return mapCollection(response.data);
}

export async function createCollection(
    values: TaxonomyFormValues
): Promise<TaxonomyCollection> {
    const response = await privateClient.post<ApiCollectionResponse>(
        '/admin/collections',
        {
            name: values.name,
            slug: values.slug,
            description: values.description || undefined,
            keywords: values.keywords,
        }
    );
    return mapCollection(response.data);
}

export async function updateCollection({
    id,
    values,
}: {
    id: string;
    values: TaxonomyFormValues;
}): Promise<TaxonomyCollection> {
    const response = await privateClient.patch<ApiCollectionResponse>(
        `/admin/collections/${id}`,
        {
            name: values.name,
            slug: values.slug,
            description: values.description || undefined,
            keywords: values.keywords,
        }
    );
    return mapCollection(response.data);
}

export async function deleteCollection(id: string): Promise<void> {
    await privateClient.delete(`/admin/collections/${id}`);
}

export async function listPublicCollections(
    params: TaxonomyListParams = {}
): Promise<TaxonomyPage<TaxonomyCollection>> {
    const response = await publicClient.get<ApiCollectionPage>(
        COLLECTIONS_ENDPOINT,
        { params }
    );
    return mapPage(response.data, mapCollection);
}

export async function getPublicCollection(slug: string): Promise<TaxonomyCollection> {
    const response = await publicClient.get<ApiCollectionResponse>(
        `${COLLECTIONS_ENDPOINT}/${encodeURIComponent(slug)}`
    );
    return mapCollection(response.data);
}

export async function listAdminTags(
    params: TaxonomyListParams = {}
): Promise<TaxonomyPage<TaxonomyTag>> {
    const response = await privateClient.get<ApiTagPage>('/admin/tags', { params });
    return mapPage(response.data, mapTag);
}

export async function getAdminTag(id: string): Promise<TaxonomyTag> {
    const response = await privateClient.get<ApiTagResponse>(`/admin/tags/${id}`);
    return mapTag(response.data);
}

export async function createTag(values: TaxonomyFormValues): Promise<TaxonomyTag> {
    const response = await privateClient.post<ApiTagResponse>('/admin/tags', {
        name: values.name,
        slug: values.slug,
        description: values.description,
    });
    return mapTag(response.data);
}

export async function updateTag({
    id,
    values,
}: {
    id: string;
    values: TaxonomyFormValues;
}): Promise<TaxonomyTag> {
    const response = await privateClient.patch<ApiTagResponse>(`/admin/tags/${id}`, {
        name: values.name,
        slug: values.slug,
        description: values.description,
    });
    return mapTag(response.data);
}

export async function deleteTag(id: string): Promise<void> {
    await privateClient.delete(`/admin/tags/${id}`);
}

export async function listPublicTags(
    params: TaxonomyListParams = {}
): Promise<TaxonomyPage<TaxonomyTag>> {
    const response = await publicClient.get<ApiTagPage>(TAGS_ENDPOINT, { params });
    return mapPage(response.data, mapTag);
}

export async function getPublicTag(slug: string): Promise<TaxonomyTag> {
    const response = await publicClient.get<ApiTagResponse>(
        `${TAGS_ENDPOINT}/${encodeURIComponent(slug)}`
    );
    return mapTag(response.data);
}
