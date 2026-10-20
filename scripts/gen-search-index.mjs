#!/usr/bin/env node
/**
 * Build the docs' search index from the pages' own MDX: public/search-index.json.
 *
 * Each page is split at its h2s and h3s, so a match can link to the section
 * it is in. Heading ids are made the way rehype-slug makes them at build
 * (github-slugger over every heading, in order), so `#id` lands. Code is left
 * out: it is long and a reader searches for words. The browser fetches the
 * file the first time someone searches; no service, no WebAssembly (the CSP
 * allows neither).
 *
 * Output: { v, pages: [[route, title, [[id, heading, text], …]], …] }
 * Not committed: `prebuild` and `predev` write it.
 */
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import GithubSlugger from 'github-slugger';
import { toString } from 'mdast-util-to-string';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const pagesRoot = join(root, 'src', 'pages');
const outFile = join(root, 'public', 'search-index.json');

// A generated reference page says less per word than a guide; keep its index short.
const MAX_TEXT = { guide: 6000, sdk: 600 };

function walk(dir, out = []) {
    for (const entry of readdirSync(dir)) {
        if (entry.startsWith('_') || entry.startsWith('.') || entry === 'api') continue;
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full, out);
        else if (entry.endsWith('.mdx')) out.push(full);
    }
    return out;
}

const routeOf = (file) =>
    ('/' + relative(pagesRoot, file).split(sep).join('/'))
        .replace(/\.mdx$/, '')
        .replace(/\/index$/, '') || '/';

const SKIP = new Set([
    'code',
    'mdxjsEsm',
    'mdxFlowExpression',
    'mdxTextExpression',
    'html',
    'yaml',
]);
const BLOCK = new Set(['paragraph', 'tableCell', 'heading']);

// TypeDoc escapes reach its pages as literal "&lt;" and "&#123;" (see rehype-typedoc.mjs).
const NAMED = { lt: '<', gt: '>', amp: '&', quot: '"' };
const decode = (s) =>
    s.replace(/&(?:#(\d+)|(lt|gt|amp|quot));/gi, (_, dec, name) =>
        dec ? String.fromCodePoint(Number(dec)) : NAMED[name.toLowerCase()]
    );

const tidy = (s) =>
    decode(s)
        // TypeDoc's property anchors and its "Defined in" source lines.
        .replace(/<a id="[^"]*"><\/a>/g, ' ')
        .replace(/Defined in:?\s*\S+:\d+/g, ' ')
        .replace(/\b[\w.-]+\/src\/[\w./-]+:\d+\b/g, ' ')
        // TypeDoc's list dashes inside a type ("- skipCheck? boolean - …").
        .replace(/(^|\s)-(?=\s|$)/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const processor = unified().use(remarkParse).use(remarkMdx).use(remarkGfm);

function indexPage(file) {
    const route = routeOf(file);
    const sdk = route.startsWith('/sdk/');
    const tree = processor.parse(readFileSync(file, 'utf8'));
    const slugger = new GithubSlugger();
    let title = '';
    const sections = [['', '', []]];
    const visit = (node) => {
        if (SKIP.has(node.type)) return;
        if (node.type === 'heading') {
            // The id from the text as rehype-slug saw it; the words as the page shows them.
            const raw = toString(node).trim();
            const id = slugger.slug(raw);
            const text = tidy(raw);
            if (node.depth === 1 && !title) title = text;
            else if (node.depth === 2 || node.depth === 3) sections.push([id, text, []]);
            else sections.at(-1)[2].push(text);
            return;
        }
        if (BLOCK.has(node.type)) {
            // TypeDoc's breadcrumb lines above the title (the page does not show them).
            if (sdk && !title) return;
            const text = tidy(toString(node));
            if (text) sections.at(-1)[2].push(text);
            return;
        }
        // A table's header row names its columns; the rows say something.
        const children = node.type === 'table' ? node.children.slice(1) : (node.children ?? []);
        for (const child of children) visit(child);
    };
    visit(tree);
    const cap = sdk ? MAX_TEXT.sdk : MAX_TEXT.guide;
    let budget = cap;
    const out = [];
    for (const [id, heading, parts] of sections) {
        let text = parts.join(' ');
        if (text.length > budget) text = text.slice(0, Math.max(0, budget)).replace(/\s\S*$/, '');
        budget -= text.length;
        if (id || text) out.push([id, heading, text]);
    }
    return [route, title || route.split('/').pop() || 'Docs', out];
}

const pages = walk(pagesRoot)
    .map(indexPage)
    .sort((a, b) => a[0].localeCompare(b[0]));
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ v: 1, pages }));
const kb = (statSync(outFile).size / 1024).toFixed(0);
console.log(`search-index: ${pages.length} pages, ${kb} KB → public/search-index.json`);
