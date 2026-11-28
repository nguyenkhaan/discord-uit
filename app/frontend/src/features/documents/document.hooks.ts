import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    getAdminDocumentClassification,
    getAdminDocumentPreview,
    listAdminSubmissions,
    listMySubmissions,
    reviewAdminDocument,
    retryAdminDocumentClassification,
    updateAdminDocumentTaxonomy,
    uploadDocument,
} from '@/features/documents/document.service';
import type {
    DocumentSubmission,
    DocumentTaxonomyUpdateInput,
    UploadDocumentInput,
    UploadProgress,
} from '@/features/documents/document.type';
import { taxonomyKeys } from '@/features/taxonomy/taxonomy.keys';

export const documentKeys = {
    all: ['documents'] as const,
    mySubmissions: () => [...documentKeys.all, 'my-submissions'] as const,
    adminSubmissions: () => [...documentKeys.all, 'admin-submissions'] as const,
    adminPreview: (submissionId: string) =>
        [...documentKeys.all, 'admin-preview', submissionId] as const,
    adminClassification: (submissionId: string) =>
        [...documentKeys.all, 'admin-classification', submissionId] as const,
};

export function useMySubmissionsQuery() {
    return useQuery({
        queryKey: documentKeys.mySubmissions(),
        queryFn: listMySubmissions,
    });
}

export function useAdminSubmissionsQuery() {
    return useQuery({
        queryKey: documentKeys.adminSubmissions(),
        queryFn: listAdminSubmissions,
    });
}

export function useAdminDocumentPreviewQuery(submissionId: string | undefined) {
    return useQuery({
        enabled: Boolean(submissionId),
        queryKey: documentKeys.adminPreview(submissionId ?? ''),
        queryFn: () => getAdminDocumentPreview(submissionId ?? ''),
    });
}

export function useAdminDocumentClassificationQuery(
    submissionId: string | undefined,
    isSubmissionProcessing: boolean
) {
    return useQuery({
        enabled: Boolean(submissionId),
        queryKey: documentKeys.adminClassification(submissionId ?? ''),
        queryFn: () => getAdminDocumentClassification(submissionId ?? ''),
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return status === 'QUEUED' ||
                status === 'RUNNING' ||
                (status == null && isSubmissionProcessing)
                ? 3000
                : false;
        },
    });
}

export function useUploadDocumentMutation(
    onProgress?: (progress: UploadProgress) => void
) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (input: UploadDocumentInput) =>
            uploadDocument(input, onProgress),
        onSuccess: () =>
            queryClient.invalidateQueries({
                queryKey: documentKeys.mySubmissions(),
            }),
    });
}

export function useReviewAdminDocumentMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: reviewAdminDocument,
        onSuccess: (_, variables) => {
            void queryClient.invalidateQueries({
                queryKey: documentKeys.adminSubmissions(),
            });
            void queryClient.invalidateQueries({
                queryKey: documentKeys.adminPreview(variables.submissionId),
            });
        },
    });
}

export function useRetryAdminDocumentClassificationMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: retryAdminDocumentClassification,
        onSuccess: (_, submissionId) => {
            void queryClient.invalidateQueries({
                queryKey: documentKeys.adminClassification(submissionId),
            });
            void queryClient.invalidateQueries({
                queryKey: documentKeys.adminSubmissions(),
            });
        },
    });
}

export function useUpdateAdminDocumentTaxonomyMutation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            documentId,
            collectionSlugs,
            tagSlugs,
        }: DocumentTaxonomyUpdateInput) =>
            updateAdminDocumentTaxonomy(documentId, {
                collectionSlugs,
                tagSlugs,
            }),
        onSuccess: (updated) => {
            queryClient.setQueryData<DocumentSubmission[]>(
                documentKeys.adminSubmissions(),
                (current) =>
                    current?.map((item) =>
                        item.documentId === updated.documentId
                            ? {
                                  ...item,
                                  collectionSlugs: updated.collectionSlugs,
                                  tagSlugs: updated.tagSlugs,
                              }
                            : item
                    )
            );
            void queryClient.invalidateQueries({
                queryKey: documentKeys.adminSubmissions(),
            });
            void queryClient.invalidateQueries({ queryKey: taxonomyKeys.all });
        },
    });
}
