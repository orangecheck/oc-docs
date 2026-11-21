// Every public page under src/pages, as its route and source file. The sitemap and
// llms.txt both read this, so they list the same pages.
//
// A page is listed iff it is a static (non-[param]) page, is not infra or api, and
// its source does not declare noindex.

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const PAGE_EXT = /\.(tsx|ts|jsx|js|mdx|md)$/;
const INFRA = /^(_app|_document|_error|404|500|sitemap.*|robots.*)$/;

function walk(dir, acc = []) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const abs = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'api' || entry.name.startsWith('_')) continue;
            walk(abs, acc);
        } else if (PAGE_EXT.test(entry.name)) {
            acc.push(abs);
        }
    }
    return acc;
}

/**
 * @param {string} root the repo root
 * @returns {{ route: string, rel: string, abs: string, src: string }[]} in walk order
 */
export function listPages(root = process.cwd()) {
    const pagesDir = join(root, 'src', 'pages');
    const seen = new Set();
    const pages = [];
    for (const abs of walk(pagesDir)) {
        const rel = relative(root, abs).split(sep).join('/');
        const base = rel.split('/').pop().replace(PAGE_EXT, '');
        if (INFRA.test(base)) continue;
        if (rel.includes('[')) continue; // dynamic [param] route — not statically enumerable
        let route = relative(pagesDir, abs).split(sep).join('/').replace(PAGE_EXT, '');
        route = '/' + route.replace(/\/index$/, '').replace(/^index$/, '');
        if (seen.has(route)) continue;
        let src = '';
        try {
            src = readFileSync(abs, 'utf8');
        } catch {
            /* unreadable — skip */
        }
        if (/noindex/i.test(src)) continue; // honor the page's own noindex declaration
        seen.add(route);
        pages.push({ route, rel, abs, src });
    }
    return pages;
}
