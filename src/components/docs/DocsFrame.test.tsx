import type { OcSessionState } from '@orangecheck/auth-client';

import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

let session: Partial<OcSessionState> | null = null;
vi.mock('@orangecheck/auth-client', async (original) => ({
    ...(await original<object>()),
    useOptionalOcSession: () => session,
}));

const { DocsFrame } = await import('./DocsFrame');

/** The docs header for a page, with the session in the given state. */
function header(state: Partial<OcSessionState>, bare = false): string {
    session = state;
    const router = { pathname: '/attest/api', basePath: '/docs', query: {}, asPath: '/attest/api' };
    const html = renderToStaticMarkup(
        <RouterContext.Provider value={router as never}>
            <DocsFrame path="/attest/api" bare={bare}>
                page
            </DocsFrame>
        </RouterContext.Provider>
    );
    return html.slice(html.indexOf('<header'), html.indexOf('</header>'));
}

/** Each link as "words -> href", with what is hidden from a reader (aria-hidden leaves) dropped. */
function links(html: string): string[] {
    return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)].map(([, attrs, inner]) => {
        const words = inner!
            .replace(/<span aria-hidden="true"[^>]*>[^<]*<\/span>/g, '')
            .replace(/<[^>]+>/g, '')
            .trim();
        return `${words} -> ${attrs!.match(/href="([^"]*)"/)?.[1]}`;
    });
}

const SIGN_IN = 'https://ochk.io/signin';
const ACCOUNT = 'https://ochk.app/me/account';
const SIGNED_IN: Partial<OcSessionState> = {
    status: 'authenticated',
    account: {
        displayName: 'Satoshi',
        displayIdentity: { kind: 'did', value: 'did:oc:test' },
    } as OcSessionState['account'],
};

describe('the docs header', () => {
    it.each([false, true])('signed out, offers Sign in and Get an account (bare %s)', (bare) => {
        const html = header({ status: 'anonymous' }, bare);
        expect(links(html)).toEqual(
            expect.arrayContaining([`Sign in -> ${SIGN_IN}`, `Get an account -> ${SIGN_IN}`])
        );
        expect(html).toContain('data-oca-cta');
    });

    it('signed in, its CTA goes to the account on ochk.app and Sign in is gone', () => {
        const html = header(SIGNED_IN);
        expect(links(html)).toContain(`Your account -> ${ACCOUNT}`);
        expect(html).not.toContain('Sign in');
        // The account menu beside the CTA is this header's only way to sign out.
        expect(html).toMatch(/<button[^>]*>(?:(?!<\/button>)[\s\S])*Satoshi/);
        // "Get an account" stays only as the CTA's hidden reserve, which keeps the bar one width.
        expect(links(html).filter((l) => l.startsWith('Get an account'))).toEqual([]);
    });

    it('while the session is checked, the CTA keeps its place and nothing in the bar links to sign-in', () => {
        const html = header({ status: 'loading' });
        expect(html).toContain('data-oca-cta');
        expect(html).not.toMatch(/<a data-oca-cta/);
        expect(links(html).filter((l) => l.endsWith(`-> ${SIGN_IN}`))).toEqual([]);
    });

    it('draws one lockup', () => {
        // The flat lockup's swoosh is a 16 by 8 drawing; the app icon's tile is never in chrome.
        expect(header({ status: 'anonymous' }).match(/viewBox="0 0 16 8"/g)).toHaveLength(1);
    });
});
