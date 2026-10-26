import { privateClient } from '@/api/client';
import type {
    NotificationListRequest,
    NotificationListResponse,
    NotificationResponse,
    SendAdminMessageRequest,
    UnreadNotificationCountResponse,
} from '@/features/notification/notification.type';

const NOTIFICATION_ENDPOINT = '/notifications';

export async function listNotifications(
    request: NotificationListRequest = {}
): Promise<NotificationListResponse> {
    const response = await privateClient.get<NotificationListResponse>(
        NOTIFICATION_ENDPOINT,
        { params: request }
    );
    return response.data;
}

export async function getNotification(
    notificationId: string
): Promise<NotificationResponse> {
    const response = await privateClient.get<NotificationResponse>(
        `${NOTIFICATION_ENDPOINT}/${notificationId}`
    );
    return response.data;
}

export async function getUnreadNotificationCount(): Promise<UnreadNotificationCountResponse> {
    const response = await privateClient.get<UnreadNotificationCountResponse>(
        `${NOTIFICATION_ENDPOINT}/unread-count`
    );
    return response.data;
}

export async function markNotificationAsRead(
    notificationId: string
): Promise<void> {
    await privateClient.patch(
        `${NOTIFICATION_ENDPOINT}/${notificationId}/read`
    );
}

export async function deleteNotification(
    notificationId: string
): Promise<void> {
    await privateClient.delete(`${NOTIFICATION_ENDPOINT}/${notificationId}`);
}

export async function sendAdminMessage(
    request: SendAdminMessageRequest
): Promise<NotificationResponse> {
    const response = await privateClient.post<NotificationResponse>(
        '/admin/notifications/messages',
        request
    );
    return response.data;
}
