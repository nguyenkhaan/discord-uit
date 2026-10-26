import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { privateClient } from '@/api/client';
import {
    deleteNotification,
    getUnreadNotificationCount,
    listNotifications,
    markNotificationAsRead,
    sendAdminMessage,
} from '@/features/notification/notification.service';

const originalGet = privateClient.get;
const originalPost = privateClient.post;
const originalPatch = privateClient.patch;
const originalDelete = privateClient.delete;

afterEach(() => {
    privateClient.get = originalGet;
    privateClient.post = originalPost;
    privateClient.patch = originalPatch;
    privateClient.delete = originalDelete;
});

describe('notification service', () => {
    it('lists notifications with pagination parameters', async () => {
        const response = {
            notifications: [{ id: 'notification-id', content: 'Nội dung' }],
            page: 0,
            size: 20,
            totalElements: 1,
            totalPages: 1,
        };
        const calls: unknown[][] = [];
        privateClient.get = (async (...arguments_: unknown[]) => {
            calls.push(arguments_);
            return { data: response };
        }) as typeof privateClient.get;

        assert.deepEqual(
            await listNotifications({ page: 0, size: 20 }),
            response
        );
        assert.deepEqual(calls, [
            ['/notifications', { params: { page: 0, size: 20 } }],
        ]);
    });

    it('reads the unread notification count', async () => {
        const calls: unknown[][] = [];
        privateClient.get = (async (...arguments_: unknown[]) => {
            calls.push(arguments_);
            return { data: { unreadCount: 3 } };
        }) as typeof privateClient.get;

        assert.deepEqual(await getUnreadNotificationCount(), {
            unreadCount: 3,
        });
        assert.deepEqual(calls, [['/notifications/unread-count']]);
    });

    it('marks one notification as read', async () => {
        const calls: unknown[][] = [];
        privateClient.patch = (async (...arguments_: unknown[]) => {
            calls.push(arguments_);
            return { data: undefined };
        }) as typeof privateClient.patch;

        await markNotificationAsRead('notification-id');
        assert.deepEqual(calls, [['/notifications/notification-id/read']]);
    });

    it('deletes one notification', async () => {
        const calls: unknown[][] = [];
        privateClient.delete = (async (...arguments_: unknown[]) => {
            calls.push(arguments_);
            return { data: undefined };
        }) as typeof privateClient.delete;

        await deleteNotification('notification-id');
        assert.deepEqual(calls, [['/notifications/notification-id']]);
    });

    it('sends the contract payload without mock recipient data', async () => {
        const request = {
            recipientUserId: 'dd3344db-0c80-4b69-8836-bdaf27975ca7',
            content: 'Thông báo từ quản trị viên',
        };
        const response = {
            id: 'notification-id',
            kind: 'ADMIN_MESSAGE' as const,
            content: request.content,
        };
        const calls: unknown[][] = [];
        privateClient.post = (async (...arguments_: unknown[]) => {
            calls.push(arguments_);
            return { data: response };
        }) as typeof privateClient.post;

        assert.deepEqual(await sendAdminMessage(request), response);
        assert.deepEqual(calls, [['/admin/notifications/messages', request]]);
    });
});
