import type { components } from '@/contract/api-contract';

export type NotificationListRequest =
    components['schemas']['NotificationListRequest'];
export type NotificationListResponse =
    components['schemas']['NotificationListResponse'];
export type NotificationResponse =
    components['schemas']['NotificationResponse'];
export type NotificationKind = NonNullable<NotificationResponse['kind']>;
export type UnreadNotificationCountResponse =
    components['schemas']['UnreadNotificationCountResponse'];
export type SendAdminMessageRequest =
    components['schemas']['SendAdminMessageRequest'];

export interface NotificationListQueryOptions {
    enabled?: boolean;
    request?: NotificationListRequest;
}
