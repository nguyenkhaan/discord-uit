import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getPostLoginRedirect } from '@/features/auth/auth.redirect';

describe('post-login redirect', () => {
    it('returns to the page saved by AuthGuard, keeping the query string', () => {
        assert.equal(
            getPostLoginRedirect({
                from: { pathname: '/invite/abc', search: '?x=1' },
            }),
            '/invite/abc?x=1'
        );
    });

    it('falls back to /home when there is no saved page', () => {
        assert.equal(getPostLoginRedirect(null), '/home');
        assert.equal(getPostLoginRedirect({}), '/home');
    });

    it('rejects protocol-relative paths to prevent open redirects', () => {
        assert.equal(
            getPostLoginRedirect({ from: { pathname: '//evil.com' } }),
            '/home'
        );
        assert.equal(
            getPostLoginRedirect({ from: { pathname: 'https://evil.com' } }),
            '/home'
        );
    });
});
