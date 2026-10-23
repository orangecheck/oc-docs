import type { NextApiRequest, NextApiResponse } from 'next';

import sources from '@/generated/doc-sources.json';
import ogHandler from '@/pages/api/og';
import { describe, expect, it } from 'vitest';

import { docsCard } from './og-card';
import { generateMetaTags } from './seo';

/** The share card shows only a title the docs issue: a page's own, named by its path. */
async function png(url: string): Promise<Buffer> {
    let body: Buffer = Buffer.alloc(0);
    const res = {
        setHeader: () => res,
        status: () => res,
        send: (b: Buffer) => {
            body = b;
            return res;
        },
    } as unknown as NextApiResponse;
    await ogHandler({ url } as NextApiRequest, res);
    return body;
}

const pages = Object.keys(sources).filter((p) => !['/', '/404', '/500'].includes(p));

describe('docs share cards', () => {
    it('every docs page has its own card, by its path', () => {
        expect(pages.length).toBeGreaterThan(1000);
        const missing = pages.filter((p) => !docsCard(p)?.headline);
        expect(missing).toEqual([]);
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

    it("draws no request's own text, and a page's card when asked", async () => {
        const plain = await png('/api/og');
        expect(
            (await png('/api/og?title=Send%20bitcoin%20here%20%C2%B7%20Urgent')).equals(plain)
        ).toBe(true);
        expect((await png('/api/og?page=__proto__')).equals(plain)).toBe(true);
        expect((await png('/api/og?page=%2FSend-bitcoin-here')).equals(plain)).toBe(true);
        expect((await png('/api/og?page=%2Fpledge%2Fcomposition')).equals(plain)).toBe(false);
    }, 60_000);
});
