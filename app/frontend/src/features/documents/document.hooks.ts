import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    getAdminDocumentPreview,
    listAdminSubmissions,
    listMySubmissions,
    reviewAdminDocument,
    uploadDocument,
} from '@/features/documents/document.service';
import type {
    UploadDocumentInput,
    UploadProgress,
} from '@/features/documents/document.type';

export const documentKeys = {
    all: ['documents'] as const,
    mySubmissions: () => [...documentKeys.all, 'my-submissions'] as const,
    adminSubmissions: () => [...documentKeys.all, 'admin-submissions'] as const,
    adminPreview: (submissionId: string) =>
        [...documentKeys.all, 'admin-preview', submissionId] as const,
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
