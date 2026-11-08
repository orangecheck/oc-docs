import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import sources from '@/generated/doc-sources.json';
import { describe, expect, it } from 'vitest';

import { docSourceUrl } from '@/components/docs/sources';

const PAGES = join(__dirname, '..', 'pages');

/** Every MDX page under src/pages, as its route and its repo path. */
const mdxPages = (readdirSync(PAGES, { recursive: true }) as string[])
    .map((f) => f.split('\\').join('/'))
    .filter(
        (f) =>
            f.endsWith('.mdx') && !f.includes('[') && !f.split('/').some((p) => p.startsWith('_'))
    )
    .map((f) => ({
        route: ('/' + f.replace(/\.mdx$/, '')).replace(/\/index$/, '') || '/',
        file: `src/pages/${f}`,
    }));

describe('the route to source manifest the tests and the build read', () => {
    it('names every MDX page, so each has a source link and a share card', () => {
        expect(mdxPages.length).toBeGreaterThan(1000);
        const manifest: Record<string, string> = sources;
        const missing = mdxPages.filter((p) => manifest[p.route] !== p.file).map((p) => p.route);
        expect(missing).toEqual([]);
    });

    it('links each page to its own file', () => {
        const page = mdxPages.find((p) => p.route === '/attest/security');
        expect(page).toBeDefined();
        expect(docSourceUrl(page!.route)).toBe(
            'https://github.com/orangecheck/oc-docs/blob/main/src/pages/attest/security.mdx'
        );
    });
});
