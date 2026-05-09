/**
 * Dynamic sitemap.xml — walks the filesystem at request time and emits a
 * URL for every .mdx page under src/pages/. Replaces the static
 * public/sitemap.xml that was hand-maintained (and consequently missed
 * the entire 666-page auto-generated /sdk tree).
 *
 * Cache-Control set to 1h edge + 1d SWR so search engines don't hammer
 * filesystem-walks on every crawl, but new pages show up within a day.
 */

import type { GetServerSideProps } from 'next';

import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SITE_URL = 'https://docs.ochk.io';

interface UrlEntry {
    loc: string;
    /** ISO date. */
    lastmod?: string;
    priority: number;
    changefreq: 'daily' | 'weekly' | 'monthly';
}

function walkPages(rootDir: string): UrlEntry[] {
    const entries: UrlEntry[] = [];
    const today = new Date().toISOString().slice(0, 10);

    function walk(dir: string) {
        for (const entry of readdirSync(dir)) {
            // Skip Next internals + API routes (not user-facing).
            if (entry.startsWith('_') || entry === 'api' || entry.startsWith('.')) {
                continue;
            }
            const full = join(dir, entry);
            const st = statSync(full);
            if (st.isDirectory()) {
                walk(full);
                continue;
            }
            if (!entry.endsWith('.mdx') && !entry.endsWith('.tsx')) continue;
            // Skip dynamic [param] routes (no concrete URL to emit).
            if (entry.includes('[')) continue;

            const rel = relative(rootDir, full).split(sep).join('/');
            // sitemap.xml.ts emits the sitemap itself — skip.
            if (rel === 'sitemap.xml.ts') continue;
            // 404.tsx isn't a real route.
            if (rel === '404.tsx') continue;

            // Convert filesystem path → URL path:
            //   foo/bar.mdx          → /foo/bar
            //   foo/index.mdx        → /foo
            //   index.mdx            → /
            let route = '/' + rel.replace(/\.(mdx|tsx)$/, '');
            route = route.replace(/\/index$/, '') || '/';

            // Priority + changefreq buckets:
            const isHome = route === '/';
            const isSdk = route.startsWith('/sdk/');
            entries.push({
                loc: SITE_URL + route,
                lastmod: today,
                priority: isHome ? 1.0 : isSdk ? 0.5 : 0.8,
                changefreq: isHome ? 'weekly' : isSdk ? 'monthly' : 'weekly',
            });
        }
    }
    walk(rootDir);
    return entries;
}

function emitXml(entries: UrlEntry[]): string {
    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    for (const e of entries) {
        lines.push('    <url>');
        lines.push(`        <loc>${e.loc}</loc>`);
        if (e.lastmod) lines.push(`        <lastmod>${e.lastmod}</lastmod>`);
        lines.push(`        <changefreq>${e.changefreq}</changefreq>`);
        lines.push(`        <priority>${e.priority.toFixed(1)}</priority>`);
        lines.push('    </url>');
    }
    lines.push('</urlset>');
    return lines.join('\n') + '\n';
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
    const pagesRoot = join(process.cwd(), 'src', 'pages');
    const entries = walkPages(pagesRoot)
        // Sort: home first, then alphabetically. Stable across deploys
        // makes diff-of-sitemaps a useful signal.
        .sort((a, b) => {
            if (a.loc === SITE_URL + '/') return -1;
            if (b.loc === SITE_URL + '/') return 1;
            return a.loc.localeCompare(b.loc);
        });

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader(
        'Cache-Control',
        'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
    );
    res.write(emitXml(entries));
    res.end();
    return { props: {} };
};

// Page component never renders — getServerSideProps writes directly.
export default function Sitemap() {
    return null;
}
