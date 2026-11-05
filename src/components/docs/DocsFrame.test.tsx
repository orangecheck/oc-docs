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

/** The whole docs page for a path, signed out. */
function page(bare: boolean): string {
    session = { status: 'anonymous' };
    const router = { pathname: '/attest/api', basePath: '/docs', query: {}, asPath: '/attest/api' };
    return renderToStaticMarkup(
        <RouterContext.Provider value={router as never}>
            <DocsFrame path="/attest/api" bare={bare}>
                page
            </DocsFrame>
        </RouterContext.Provider>
    );
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
    it.each([false, true])(
        'signed out, holds one way in, to ochk.io and back (bare %s)',
        (bare) => {
            const html = header({ status: 'anonymous' }, bare);
            const ways = links(html).filter((l) => l.includes(`-> ${SIGN_IN}`));
            expect(ways).toHaveLength(1);
            expect(ways[0]).toMatch(/^Sign in/);
            expect(html.match(/data-oca-account="out"/g)).toHaveLength(1);
            expect(html).not.toContain('Get an account');
            expect(html).not.toContain('data-oca-cta');
        }
    );

    it('signed in, is one trigger named for the account, with no "Your account" beside it', () => {
        const html = header(SIGNED_IN);
        expect(html.match(/data-oca-account="[^"]*"/g)).toEqual(['data-oca-account="in"']);
        expect(html).toMatch(/<button[^>]*>(?:(?!<\/button>)[\s\S])*Satoshi/);
        expect(html).not.toContain('Your account');
        expect(html).not.toContain('data-oca-cta');
        expect(links(html).filter((l) => l.includes(SIGN_IN))).toEqual([]);
        expect(links(html).filter((l) => l.includes(ACCOUNT))).toEqual([]);
    });

    it('while the session is checked, holds a placeholder that links nowhere', () => {
        const html = header({ status: 'loading' });
        expect(html).toMatch(/<span[^>]*data-oca-account="pending"[^>]*aria-hidden="true"/);
        expect(links(html).filter((l) => l.includes(SIGN_IN))).toEqual([]);
    });

    it('when the session check failed, never guesses signed out and never says "Your account"', () => {
        const html = header({ status: 'error' });
        expect(html).toMatch(/<span[^>]*data-oca-account="unknown"[^>]*aria-hidden="true"/);
        expect(links(html).filter((l) => l.includes(SIGN_IN))).toEqual([]);
        expect(links(html).filter((l) => l.includes(ACCOUNT))).toEqual([]);
        expect(html).not.toContain('Your account');
    });

    it('draws one lockup', () => {
        // The flat lockup's swoosh is a 16 by 8 drawing; the app icon's tile is never in chrome.
        expect(header({ status: 'anonymous' }).match(/viewBox="0 0 16 8"/g)).toHaveLength(1);
    });
});

/** A page frame's own attribute (its class also names it, for the nested-frame rule). */
const FRAMES = /\sdata-oca-page-frame=""/g;

describe('the docs page frame', () => {
    it('puts a bare page (404, 500) in one framed column, its main', () => {
        const html = page(true);
        expect(html.match(FRAMES)).toHaveLength(1);
        expect(html).toMatch(
            /<main(?=[^>]*\bid="main-content")(?=[^>]*\sdata-oca-page-frame="")[^>]*>/
        );
    });

    it('draws one framed column on a docs page too, never one inside another', () => {
        expect(page(false).match(FRAMES)).toHaveLength(1);
    });
});
