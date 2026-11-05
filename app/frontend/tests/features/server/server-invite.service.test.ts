import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { privateClient } from '@/api/client';
import {
    acceptDirectInvite,
    createDirectInvite,
    createInviteLink,
    getInviteLinkDetails,
    joinServerByInviteLink,
    lookupUserByEmail,
    revokeInviteLink,
} from '@/features/server/server-invite.service';

const originalGet = privateClient.get;
const originalPost = privateClient.post;
const originalDelete = privateClient.delete;

afterEach(() => {
    privateClient.get = originalGet;
    privateClient.post = originalPost;
    privateClient.delete = originalDelete;
});

function capture(method: 'get' | 'post' | 'delete', data: unknown = {}) {
    const calls: unknown[][] = [];
    const fake = async (...arguments_: unknown[]) => {
        calls.push(arguments_);
        return { data };
    };
    if (method === 'get') privateClient.get = fake as typeof privateClient.get;
    if (method === 'post')
        privateClient.post = fake as typeof privateClient.post;
    if (method === 'delete') {
        privateClient.delete = fake as typeof privateClient.delete;
    }
    return calls;
}

describe('server invite service', () => {
    it('creates an invite link without sending serverId in the body', async () => {
        const calls = capture('post', { inviteUrl: 'http://x/invite/abc' });

        const response = await createInviteLink({
            serverId: 'server-1',
            maxUses: 10,
            expiresInHours: 3,
        });

        assert.equal(calls[0]?.[0], '/servers/server-1/invites/links');
        assert.deepEqual(calls[0]?.[1], { maxUses: 10, expiresInHours: 3 });
        assert.equal(response.inviteUrl, 'http://x/invite/abc');
    });

    it('revokes a link by server and invite id', async () => {
        const calls = capture('delete');

        await revokeInviteLink({ serverId: 'server-1', inviteId: 'invite-1' });

        assert.equal(calls[0]?.[0], '/servers/server-1/invites/links/invite-1');
    });

    it('encodes the token for details and join requests', async () => {
        const getCalls = capture('get');
        const postCalls = capture('post');

        await getInviteLinkDetails('a/b');
        await joinServerByInviteLink('a/b');

        assert.equal(getCalls[0]?.[0], '/invites/a%2Fb');
        assert.equal(postCalls[0]?.[0], '/invites/a%2Fb/join');
    });

    it('looks a user up by exact email as a query param', async () => {
        const calls = capture('get', { userId: 'user-1' });

        await lookupUserByEmail('bob@gmail.com');

        assert.equal(calls[0]?.[0], '/users/lookup');
        assert.deepEqual(calls[0]?.[1], { params: { email: 'bob@gmail.com' } });
    });

    it('sends a direct invite with only the recipient id in the body', async () => {
        const calls = capture('post');

        await createDirectInvite({
            serverId: 'server-1',
            recipientId: 'user-1',
        });

        assert.equal(calls[0]?.[0], '/servers/server-1/invites');
        assert.deepEqual(calls[0]?.[1], { recipientId: 'user-1' });
    });

    it('accepts a direct invite by id', async () => {
        const calls = capture('post', { serverName: 'SE347' });

        const response = await acceptDirectInvite('invite-1');

        assert.equal(calls[0]?.[0], '/invites/invite-1/accept');
        assert.equal(response.serverName, 'SE347');
    });
});
