// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { FontPreloads } from '@orangecheck/app-design/fonts';
import { FamilyAnalytics, familyAnalyticsScripts } from '@orangecheck/site-kit/analytics';
import { inlineHashes, scriptSources, themeScript } from '@orangecheck/site-kit/csp';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { ANALYTICS, HEAD_SCRIPTS } from '../lib/inline-scripts';

/**
 * ochk.io/docs's script-src runs inline scripts by hash, never 'unsafe-inline'.
 * The hashes come from HEAD_SCRIPTS and the theme script; these tests hold the
 * document to them. `oc-site-kit csp-check` holds every built page to its
 * header on a pull request, after the build.
 */

/** script-src of each rule, with the headers built as `next build` (production) or `next dev` (development) builds them. */
async function scriptSrcsUnder(env: 'production' | 'development'): Promise<string[][]> {
    vi.stubEnv('NODE_ENV', env);
    vi.resetModules();
    try {
        const nextConfig = (await import('../../next.config')).default;
        const rules = (await nextConfig.headers?.()) ?? [];
        return rules.flatMap((r) =>
            r.headers
                .filter((h) => h.key === 'Content-Security-Policy')
                .map((h) => scriptSources(h.value))
        );
    } finally {
        vi.unstubAllEnvs();
    }
}

const scriptsOf = (html: string) =>
    [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);

describe("ochk.io/docs's script-src", () => {
    it('lists the head scripts and the theme script by hash, and nothing inline besides', async () => {
        const srcs = await scriptSrcsUnder('production');
        // The build runs the analytics too: logo, Plausible sender (no oc-pulse), theme.
        const want = inlineHashes([
            HEAD_SCRIPTS[0]!,
            ...Object.values(familyAnalyticsScripts({ ...ANALYTICS, enabled: true })),
            themeScript(),
        ]).sort();
        expect(want).toHaveLength(3);
        expect(srcs).toHaveLength(1);
        for (const src of srcs) {
            expect(src).not.toContain("'unsafe-inline'");
            expect(src.filter((s) => s.startsWith("'sha256-")).sort()).toEqual(want);
        }
    });

    it("keeps 'unsafe-inline' alone under next dev, which reprints the theme script", async () => {
        const srcs = await scriptSrcsUnder('development');
        expect(srcs).toHaveLength(1);
        for (const src of srcs) {
            expect(src).toContain("'unsafe-inline'");
            expect(src.filter((s) => s.startsWith("'sha256-"))).toEqual([]);
        }
    });
});

describe('the document', () => {
    it('runs exactly the head scripts HEAD_SCRIPTS hashes', () => {
        const head = renderToStaticMarkup(
            createElement(
                'head',
                null,
                createElement(FontPreloads, { mono: true }),
                createElement(FamilyAnalytics, { ...ANALYTICS, enabled: true })
            )
        );
        expect(scriptsOf(head)).toEqual([
            HEAD_SCRIPTS[0],
            familyAnalyticsScripts({ ...ANALYTICS, enabled: true }).plausible,
        ]);
    });

    it('renders FontPreloads and FamilyAnalytics from ANALYTICS, and no inline script of its own', () => {
        const doc = readFileSync(join(__dirname, '..', 'pages', '_document.tsx'), 'utf8');
        expect(doc).toContain('<FontPreloads mono />');
        expect(doc).toContain('<FamilyAnalytics {...ANALYTICS} />');
        expect(doc).not.toMatch(/<script|dangerouslySetInnerHTML|next\/script/);
    });
});
