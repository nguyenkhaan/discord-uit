import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { privateClient, publicClient } from '@/api/client';
import {
    createCollection,
    listAdminCollections,
    listPublicTags,
} from '@/features/taxonomy/taxonomy.service';
import { getTaxonomyErrorMessage } from '@/features/taxonomy/taxonomy.utils';

const originalPrivateGet = privateClient.get;
const originalPrivatePost = privateClient.post;
const originalPublicGet = publicClient.get;

afterEach(() => {
    privateClient.get = originalPrivateGet;
    privateClient.post = originalPrivatePost;
    publicClient.get = originalPublicGet;
});

describe('taxonomy service', () => {
    it('lists admin collections with pagination and maps usage metadata', async () => {
        const response = {
            items: [
                {
                    id: 'collection-id',
                    name: 'AI',
                    slug: 'ai',
                    description: 'AI documents',
                    keywords: ['ai'],
                    updatedAt: '2026-11-21T00:00:00Z',
                    documentCount: 4,
                    classificationCount: 1,
                },
            ],
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

        assert.deepEqual(await listAdminCollections({ page: 0, size: 20 }), {
            ...response,
            items: [{ ...response.items[0], tagSlugs: [] }],
        });
        assert.deepEqual(calls, [['/admin/collections', { params: { page: 0, size: 20 } }]]);
    });

    it('uses the public tags endpoint without credentials-specific routing', async () => {
        const response = {
            items: [{ id: 'tag-id', name: 'AI', slug: 'ai', description: 'Artificial intelligence' }],
            page: 0,
            size: 20,
            totalElements: 1,
            totalPages: 1,
        };
        const calls: unknown[][] = [];
        publicClient.get = (async (...arguments_: unknown[]) => {
            calls.push(arguments_);
            return { data: response };
        }) as typeof publicClient.get;

        assert.deepEqual(await listPublicTags(), {
            ...response,
            items: [{ ...response.items[0], documentCount: 0, classificationCount: 0, updatedAt: '' }],
        });
        assert.deepEqual(calls, [['/tags', { params: {} }]]);
    });

    it('posts collection payloads to the admin endpoint', async () => {
        const calls: unknown[][] = [];
        privateClient.post = (async (...arguments_: unknown[]) => {
            calls.push(arguments_);
            return {
                data: {
                    id: 'collection-id',
                    name: 'AI',
                    slug: 'ai',
                    description: 'AI documents',
                    keywords: ['ai'],
                },
            };
        }) as typeof privateClient.post;

        await createCollection({
            name: 'AI',
            slug: 'ai',
            description: 'AI documents',
            keywords: ['ai'],
        });

        assert.deepEqual(calls, [
            ['/admin/collections', {
                name: 'AI',
                slug: 'ai',
                description: 'AI documents',
                keywords: ['ai'],
            }],
        ]);
    });
});

describe('taxonomy API errors', () => {
    it('prefers the backend message for duplicate/conflict responses', () => {
        const error = {
            isAxiosError: true,
            response: { status: 409, data: { message: 'Collection is still referenced.' } },
        };

        assert.equal(
            getTaxonomyErrorMessage(error, 'Không thể thực hiện thao tác.'),
            'Collection is still referenced.'
        );
    });
});
