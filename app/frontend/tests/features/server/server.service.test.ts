import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { privateClient } from '@/api/client';
import {
    countMyServersByStatus,
    listMyServers,
    updateServerStatus,
} from '@/features/server/server.service';
import { adminDeleteServer } from '@/features/server/server-admin.service';

const originalGet = privateClient.get;
const originalPatch = privateClient.patch;
const originalDelete = privateClient.delete;

afterEach(() => {
    privateClient.get = originalGet;
    privateClient.patch = originalPatch;
    privateClient.delete = originalDelete;
});

function captureGet(data: unknown): unknown[][] {
    const calls: unknown[][] = [];
    privateClient.get = (async (...arguments_: unknown[]) => {
        calls.push(arguments_);
        return { data };
    }) as typeof privateClient.get;
    return calls;
}

function paramsOf(call: unknown[] | undefined): string {
    const config = call?.[1] as { params: URLSearchParams };
    return config.params.toString();
}

describe('server service', () => {
    it('lists servers without a status query by default', async () => {
        const servers = [{ id: 'server-id', name: 'SE347', status: 'ACTIVE' }];
        const calls = captureGet(servers);

        assert.deepEqual(await listMyServers(), servers);
        assert.equal(calls[0]?.[0], '/servers');
        assert.equal(paramsOf(calls[0]), '');
    });

    it('sends repeated status params that Spring can bind to a Set', async () => {
        const calls = captureGet([]);

        await listMyServers({ statuses: ['ACTIVE', 'LOCKED'] });

        assert.equal(paramsOf(calls[0]), 'status=ACTIVE&status=LOCKED');
    });

    it('reads server counts by status', async () => {
        const counts = [
            { status: 'ACTIVE', serverCount: 3 },
            { status: 'LOCKED', serverCount: 1 },
            { status: 'CLOSED', serverCount: 0 },
        ];
        const calls = captureGet(counts);

        assert.deepEqual(await countMyServersByStatus(), counts);
        assert.equal(calls[0]?.[0], '/servers/status-counts');
    });

    it('updates the server status', async () => {
        const calls: unknown[][] = [];
        privateClient.patch = (async (...arguments_: unknown[]) => {
            calls.push(arguments_);
            return { data: { id: 'server-id', status: 'LOCKED' } };
        }) as typeof privateClient.patch;

        await updateServerStatus({ serverId: 'server-id', status: 'LOCKED' });

        assert.deepEqual(calls, [['/servers/server-id/status', { status: 'LOCKED' }]]);
    });

    it('sends the deletion reason as the admin delete request body', async () => {
        const calls: unknown[][] = [];
        privateClient.delete = (async (...arguments_: unknown[]) => {
            calls.push(arguments_);
            return { data: undefined };
        }) as typeof privateClient.delete;

        await adminDeleteServer({ serverId: 'server-id', reason: 'Vi phạm quy định' });

        assert.deepEqual(calls, [
            ['/admin/servers/server-id', { data: { reason: 'Vi phạm quy định' } }],
        ]);
    });
});
