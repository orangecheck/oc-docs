#!/usr/bin/env node
/**
 * Build-time generator for the route → source-file manifest that powers
 * the "view source" link in the docs chrome (DocsBreadcrumb).
 *
 * Why: every page under src/pages/ has a corresponding .mdx (or content
 * .tsx) in this repo, but the route → file mapping is ambiguous from the
 * URL alone (index.mdx vs leaf.mdx, .tsx vs .mdx, the 666-page /sdk tree).
 * Rather than hand-link GitHub from each MDX body — which drifts and was
 * only ever done on a handful of pages — we walk the filesystem once and
 * emit an exact map. Same philosophy as sitemap.xml.ts.
 *
 * Output: src/generated/doc-sources.json  { "/vote/spec": "src/pages/vote/spec.mdx", ... }
 * Committed so type-check/build always have it; `prebuild` keeps it fresh.
 */
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const pagesRoot = join(repoRoot, 'src', 'pages');
const outFile = join(repoRoot, 'src', 'generated', 'doc-sources.json');

/** route → repo-relative source path (posix). */
const map = {};

function walk(dir) {
    for (const entry of readdirSync(dir)) {
        // Skip Next internals, API routes, dotfiles.
        if (entry.startsWith('_') || entry === 'api' || entry.startsWith('.')) continue;

        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
            walk(full);
            continue;
        }
        if (!entry.endsWith('.mdx') && !entry.endsWith('.tsx')) continue;
        // Dynamic routes + non-content tsx have no stable source to point at.
        if (entry.includes('[')) continue;

        const rel = relative(pagesRoot, full).split(sep).join('/');
        if (rel === 'sitemap.xml.ts' || rel === '404.tsx' || rel === '_app.tsx') continue;
        // Only .tsx that render content matter; the two above are the only
        // non-content tsx today, but guard generically: skip tsx that aren't
        // page content is impossible to know here, so include all remaining
        // tsx (charter/index are mdx; the rest of the tree is mdx).

        let route = '/' + rel.replace(/\.(mdx|tsx)$/, '');
        route = route.replace(/\/index$/, '') || '/';

        map[route] = 'src/pages/' + rel;
    }
}

walk(pagesRoot);

mkdirSync(dirname(outFile), { recursive: true });
// Stable key order so the committed file diffs cleanly across regenerations.
const sorted = Object.fromEntries(
    Object.keys(map)
        .sort()
        .map((k) => [k, map[k]])
);
writeFileSync(outFile, JSON.stringify(sorted, null, 2) + '\n');

console.log(`doc-sources: ${Object.keys(sorted).length} routes → src/generated/doc-sources.json`);
