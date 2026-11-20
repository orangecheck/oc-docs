import type { NextApiRequest, NextApiResponse } from 'next';

import { createHash } from 'node:crypto';

import sources from '@/generated/doc-sources.json';
import ogHandler from '@/pages/api/og';
import { describe, expect, it } from 'vitest';

import { DOCS_CARDS, docsCard } from './og-card';
import { generateMetaTags } from './seo';

/** What the share-card route answers a request for `url`: status, headers and body. */
async function answer(url: string) {
    const out = {
        status: 0,
        headers: {} as Record<string, string>,
        body: Buffer.alloc(0) as Buffer,
    };
    const res = {
        setHeader: (k: string, v: string) => {
            out.headers[k.toLowerCase()] = String(v);
            return res;
        },
        status: (n: number) => {
            out.status = n;
            return res;
        },
        send: (b: Buffer) => {
            out.body = b;
            return res;
        },
        end: () => res,
    } as unknown as NextApiResponse;
    // Next takes the /docs basePath off req.url before the route sees it.
    await ogHandler({ url } as NextApiRequest, res);
    return out;
}

/** A card is the same for a whole deployment, so the browser and the edge keep it a day. */
const DAY = 'public, max-age=86400, s-maxage=86400';

/**
 * Cards as the docs' own route drew them before the move onto site-kit's
 * handler (the default and /attest equal the live cards' bytes), so the move
 * changed no pixel. A new app-design changes these; the new values come from
 * the card it then draws (app-design 2.19.0's 8:5 check, 2026-11-20).
 */
const DRAWN: Record<string, string> = {
    '/api/og': '8a2b4c7a754563cdea74fcf80d41210eae3b68c468b7f6b835e0074354d607a5',
    '/api/og?page=%2Fattest': 'a881c6156507f5d92080e56f93ab096528770d5906861a765fed18bdbb355762',
    '/api/og?page=%2Fpledge%2Fcomposition':
        'b306432500c927ab5963070a6892433b867d7410d6c7a49e0dcf2081f54fdcf8',
};

const pages = Object.keys(sources).filter((p) => !['/', '/404', '/500'].includes(p));

/** The share card shows only a title the docs issue: a page's own, named by its path. */
describe('docs share cards', () => {
    it('every docs page has its own card, by its path, at the URL its meta shares', () => {
        expect(pages.length).toBeGreaterThan(1000);
        const missing = pages.filter((p) => !docsCard(p)?.headline);
        expect(missing).toEqual([]);
        expect(Object.keys(DOCS_CARDS).sort()).toEqual([...pages].sort());
        const meta = generateMetaTags({
            title: 'Composition · OC Pledge',
            canonical: '/pledge/composition',
        });
        expect(meta.openGraph.images[0]!.url).toBe(
            'https://ochk.io/docs/api/og?page=%2Fpledge%2Fcomposition'
        );
    });

    it('a path the docs do not have, or no page at all, gets the default card', () => {
        for (const p of ['/Send-bitcoin-here', '__proto__', 'constructor', '', null, '/'])
            expect(docsCard(p)).toBeNull();
        expect(
            generateMetaTags({ title: 'Not found', canonical: null }).openGraph.images[0]!.url
        ).toBe('https://ochk.io/docs/api/og');
    });

    it('draws a card at its one URL, kept a day, as it drew it before', async () => {
        for (const [url, sha] of Object.entries(DRAWN)) {
            const a = await answer(url);
            expect([a.status, a.headers['cache-control']], url).toEqual([200, DAY]);
            expect(createHash('sha256').update(a.body).digest('hex'), url).toBe(sha);
        }
    }, 60_000);

    it('sends any other query to the one URL of the card it can have, under /docs, kept a day', async () => {
        // A request's own text never reaches a card, and a 308 never leaves the docs for ochk.io's own card.
        for (const [asked, to] of [
            ['/api/og?title=Send%20bitcoin%20here%20%C2%B7%20Urgent', '/docs/api/og'],
            ['/api/og?page=__proto__', '/docs/api/og'],
            ['/api/og?page=%2FSend-bitcoin-here', '/docs/api/og'],
            ['/api/og?page=%2F', '/docs/api/og'],
            [
                '/api/og?page=%2Fpledge%2Fcomposition&title=x',
                '/docs/api/og?page=%2Fpledge%2Fcomposition',
            ],
        ]) {
            const a = await answer(asked!);
            expect(
                [a.status, a.headers.location, a.headers['cache-control'], a.body.length],
                asked
            ).toEqual([308, to, DAY, 0]);
        }
    });
});
