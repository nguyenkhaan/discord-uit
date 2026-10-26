import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    deleteNotification,
    getUnreadNotificationCount,
    listNotifications,
    markNotificationAsRead,
    sendAdminMessage,
} from '@/features/notification/notification.service';
import type {
    NotificationListQueryOptions,
    NotificationListRequest,
    SendAdminMessageRequest,
} from '@/features/notification/notification.type';

const DEFAULT_NOTIFICATION_LIST_REQUEST = {
    page: 0,
    size: 20,
} satisfies NotificationListRequest;

const notificationKeys = {
    all: ['notifications'] as const,
    list: (request: NotificationListRequest) =>
        [...notificationKeys.all, 'list', request] as const,
    unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
};

export function useGetNotifications({
    enabled = true,
    request = DEFAULT_NOTIFICATION_LIST_REQUEST,
}: NotificationListQueryOptions = {}) {
    return useQuery({
        enabled,
        queryKey: notificationKeys.list(request),
        queryFn: () => listNotifications(request),
    });
}

export function useUnreadNotificationCount() {
    return useQuery({
        queryKey: notificationKeys.unreadCount(),
        queryFn: getUnreadNotificationCount,
    });
}

export function useMarkAsReadMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId: string) =>
            markNotificationAsRead(notificationId),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
    });
}

export function useDeleteNotificationMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (notificationId: string) =>
            deleteNotification(notificationId),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
    });
}

export function useSendNotificationMutation() {
    return useMutation({
        mutationFn: (request: SendAdminMessageRequest) =>
            sendAdminMessage(request),
    });
}
