import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { privateClient, publicClient } from '@/api/client';
import {
    changeEmail,
    changePassword,
    login,
} from '@/features/auth/auth.service';

const credentials = {
    username: 'student@uit.edu.vn',
    password: 'correct-horse-battery-staple',
};

function mockPublicPost(response: unknown) {
    const originalPost = publicClient.post;
    const calls: unknown[][] = [];

    publicClient.post = (async (...arguments_: unknown[]) => {
        calls.push(arguments_);
        return { data: response };
    }) as unknown as typeof publicClient.post;

    return {
        calls,
        restore: () => {
            publicClient.post = originalPost;
        },
    };
}

function mockPrivatePost() {
    const originalPost = privateClient.post;
    const calls: unknown[][] = [];

    privateClient.post = (async (...arguments_: unknown[]) => {
        calls.push(arguments_);
        return { data: undefined };
    }) as unknown as typeof privateClient.post;

    return {
        calls,
        restore: () => {
            privateClient.post = originalPost;
        },
    };
}

describe('login', () => {
    it('posts credentials to the route relative to the API base URL', async () => {
        const tokens = {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
        };
        const post = mockPublicPost(tokens);

        try {
            assert.deepEqual(await login(credentials), tokens);
            assert.deepEqual(post.calls, [['/auth/login', credentials]]);
        } finally {
            post.restore();
        }
    });

    it('returns the backend response without persisting tokens in frontend code', async () => {
        const response = { accessToken: 'access-token' };
        const post = mockPublicPost(response);

        try {
            assert.deepEqual(await login(credentials), response);
        } finally {
            post.restore();
        }
    });
});

describe('account security routes', () => {
    it('posts password changes to the current-user endpoint', async () => {
        const request = {
            currentPassword: 'current-password',
            newPassword: 'new-password',
            logoutAllDevices: true,
        };
        const post = mockPrivatePost();

        try {
            await changePassword(request);
            assert.deepEqual(post.calls, [['/me/password-change', request]]);
        } finally {
            post.restore();
        }
    });

    it('posts email changes to the current-user endpoint', async () => {
        const request = {
            newEmail: 'student@uit.edu.vn',
            currentPassword: 'current-password',
        };
        const post = mockPrivatePost();

        try {
            await changeEmail(request);
            assert.deepEqual(post.calls, [['/me/email-change', request]]);
        } finally {
            post.restore();
        }
    });
});
