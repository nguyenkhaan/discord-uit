import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    getInviteLinkUnavailableReason,
    getRedeemableInviteLinks,
    isInviteLinkRedeemable,
} from '@/features/server/server-invite.utils';

const NOW = Date.parse('2026-11-05T12:00:00Z');
const FUTURE = '2026-11-05T15:00:00Z';
const PAST = '2026-11-05T11:00:00Z';

describe('server invite utils', () => {
    it('treats a pending, unexpired link with uses left as redeemable', () => {
        assert.equal(
            isInviteLinkRedeemable(
                {
                    status: 'PENDING',
                    expiresAt: FUTURE,
                    maxUses: 10,
                    useCount: 3,
                },
                NOW
            ),
            true
        );
    });

    it('treats a link without expiry as redeemable while uses remain', () => {
        assert.equal(
            isInviteLinkRedeemable(
                { status: 'PENDING', maxUses: 1, useCount: 0 },
                NOW
            ),
            true
        );
    });

    it('excludes revoked, expired and used-up links', () => {
        const links = [
            {
                status: 'PENDING' as const,
                expiresAt: FUTURE,
                maxUses: 5,
                useCount: 0,
            },
            {
                status: 'REVOKED' as const,
                expiresAt: FUTURE,
                maxUses: 5,
                useCount: 0,
            },
            {
                status: 'PENDING' as const,
                expiresAt: PAST,
                maxUses: 5,
                useCount: 0,
            },
            {
                status: 'PENDING' as const,
                expiresAt: FUTURE,
                maxUses: 5,
                useCount: 5,
            },
        ];

        assert.equal(getRedeemableInviteLinks(links, NOW).length, 1);
    });

    it('explains why a link is unavailable', () => {
        assert.equal(
            getInviteLinkUnavailableReason(
                {
                    status: 'PENDING',
                    expiresAt: FUTURE,
                    maxUses: 5,
                    useCount: 0,
                },
                NOW
            ),
            null
        );
        assert.match(
            getInviteLinkUnavailableReason(
                { status: 'REVOKED', maxUses: 5, useCount: 0 },
                NOW
            ) ?? '',
            /thu hồi/
        );
        assert.match(
            getInviteLinkUnavailableReason(
                { status: 'PENDING', expiresAt: PAST, maxUses: 5, useCount: 0 },
                NOW
            ) ?? '',
            /hết hạn/
        );
        assert.match(
            getInviteLinkUnavailableReason(
                {
                    status: 'ACCEPTED',
                    expiresAt: FUTURE,
                    maxUses: 5,
                    useCount: 5,
                },
                NOW
            ) ?? '',
            /hết lượt/
        );
    });
});
