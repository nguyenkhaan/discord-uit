import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    createCollection,
    createTag,
    deleteCollection,
    deleteTag,
    getPublicCollection,
    getPublicTag,
    listAdminCollections,
    listAdminTags,
    listPublicCollections,
    listPublicTags,
    updateCollection,
    updateTag,
} from '@/features/taxonomy/taxonomy.service';
import type { TaxonomyFormValues } from '@/features/taxonomy/taxonomy.type';
import { taxonomyKeys } from '@/features/taxonomy/taxonomy.keys';

export function useAdminCollectionsQuery() {
    return useQuery({
        queryKey: taxonomyKeys.adminCollections({ size: 100 }),
        queryFn: () => listAdminCollections({ size: 100 }),
        placeholderData: keepPreviousData,
    });
}

export function useAdminTagsQuery() {
    return useQuery({
        queryKey: taxonomyKeys.adminTags({ size: 100 }),
        queryFn: () => listAdminTags({ size: 100 }),
        placeholderData: keepPreviousData,
    });
}

export function usePublicCollectionsQuery() {
    return useQuery({
        queryKey: taxonomyKeys.publicCollections({ size: 100 }),
        queryFn: () => listPublicCollections({ size: 100 }),
        placeholderData: keepPreviousData,
    });
}

export function usePublicTagsQuery() {
    return useQuery({
        queryKey: taxonomyKeys.publicTags({ size: 100 }),
        queryFn: () => listPublicTags({ size: 100 }),
        placeholderData: keepPreviousData,
    });
}

export function usePublicCollectionQuery(slug: string | undefined) {
    return useQuery({
        enabled: Boolean(slug),
        queryKey: taxonomyKeys.publicCollection(slug ?? ''),
        queryFn: () => getPublicCollection(slug ?? ''),
    });
}

export function usePublicTagQuery(slug: string | undefined) {
    return useQuery({
        enabled: Boolean(slug),
        queryKey: taxonomyKeys.publicTag(slug ?? ''),
        queryFn: () => getPublicTag(slug ?? ''),
    });
}

export function useCreateCollectionMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (values: TaxonomyFormValues) => createCollection(values),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: taxonomyKeys.all }),
    });
}

export function useUpdateCollectionMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateCollection,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: taxonomyKeys.all }),
    });
}

export function useDeleteCollectionMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteCollection,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: taxonomyKeys.all }),
    });
}

export function useCreateTagMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (values: TaxonomyFormValues) => createTag(values),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: taxonomyKeys.all }),
    });
}

export function useUpdateTagMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateTag,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: taxonomyKeys.all }),
    });
}

export function useDeleteTagMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteTag,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: taxonomyKeys.all }),
    });
}
