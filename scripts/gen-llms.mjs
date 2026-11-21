#!/usr/bin/env node
/**
 * The docs for language models, after https://llmstxt.org, built from the pages:
 *
 *   public/llms.txt        an index: every page's own metadata title and description,
 *                          linked to its markdown copy, in sections by route segment;
 *   public/<route>.md      each page as plain markdown, served at /docs/<route>.md;
 *   public/llms-full.txt   every written page's copy in one file, each headed by its URL.
 *
 * A copy is the page's MDX with its import and export lines removed, every link made
 * absolute, and each component written out as the text or code it shows (an
 * interactive demo is dropped). The generated SDK reference gets a copy too, and
 * its package entry points close llms.txt as its Optional section; llms-full.txt
 * leaves it out, because the same text ships with each package.
 *
 * The routes come from scripts/page-routes.mjs, as the sitemap's do. Output is
 * deterministic. Not committed: `build` writes it.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PROTOCOL_ORDER, protocolSite } from '@orangecheck/app-design/family';
import remarkGfm from 'remark-gfm';
import remarkMdx from 'remark-mdx';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

import { listPages } from './page-routes.mjs';

export const SITE_URL = 'https://ochk.io/docs';

const processor = unified().use(remarkParse).use(remarkMdx).use(remarkGfm);

/** A page in the generated SDK reference: /sdk/<package>/… (not /sdk, /sdk/cli, /sdk/python). */
export const isSdkReference = (route) => /^\/sdk\/[^/]+\//.test(route);

/** Where a route's copy lives, relative to public/ (and to the site URL). */
export const copyPath = (route) => (route === '/' ? 'index.md' : `${route.slice(1)}.md`);

const pageUrl = (route) => (route === '/' ? SITE_URL : SITE_URL + route);

// ── metadata ────────────────────────────────────────────────────────────────

/** A string the source spells out: a literal, a template with no ${}, or a + b. */
function staticString(node) {
    if (!node) return undefined;
    if (node.type === 'Literal' && typeof node.value === 'string') return node.value;
    if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
        return node.quasis.map((q) => q.value.cooked).join('');
    }
    if (node.type === 'BinaryExpression' && node.operator === '+') {
        const l = staticString(node.left);
        const r = staticString(node.right);
        return l !== undefined && r !== undefined ? l + r : undefined;
    }
    return undefined;
}

/** `export const metadata = { title, description }`, as the page declares it. */
function readMetadata(tree) {
    for (const node of tree.children) {
        if (node.type !== 'mdxjsEsm') continue;
        for (const stmt of node.data?.estree?.body ?? []) {
            const decl = stmt.type === 'ExportNamedDeclaration' ? stmt.declaration : null;
            if (decl?.type !== 'VariableDeclaration') continue;
            for (const d of decl.declarations) {
                if (d.id.name !== 'metadata' || d.init?.type !== 'ObjectExpression') continue;
                const meta = {};
                for (const p of d.init.properties) {
                    const key = p.key?.name ?? p.key?.value;
                    if (key === 'title' || key === 'description') meta[key] = staticString(p.value);
                }
                return meta;
            }
        }
    }
    return {};
}

// ── components ──────────────────────────────────────────────────────────────

function attributes(node) {
    const out = {};
    for (const a of node.attributes) {
        if (a.type !== 'mdxJsxAttribute') continue;
        if (a.value === null || a.value === undefined) out[a.name] = true;
        else if (typeof a.value === 'string') out[a.name] = a.value;
        else {
            // {['attest', 'lock']} and the like: a static array of strings.
            const expr = a.value.data?.estree?.body?.[0]?.expression;
            if (expr?.type === 'ArrayExpression') out[a.name] = expr.elements.map(staticString);
            else out[a.name] = staticString(expr);
        }
    }
    return out;
}

// app-design's SpecCard links the spec repo's file for its kind.
const SPEC_FILES = { spec: 'SPEC.md', security: 'SECURITY.md', rationale: 'WHY.md' };

/**
 * Each component a page uses, as the markdown it shows. null drops it: the three
 * sign-in demos are live buttons and marks, and the prose around them says what they show.
 */
export const COMPONENTS = {
    InstallTabs: ({ pkg, dev }) =>
        ['```bash', `npm install ${dev ? '--save-dev ' : ''}${pkg}`, '```'].join('\n'),
    SpecCard: ({ repo, file, kind = 'spec', note }) => {
        if (!repo) return null;
        const f = file ?? SPEC_FILES[kind] ?? SPEC_FILES.spec;
        const link = `[${repo}/${f}](https://github.com/orangecheck/${repo}/blob/main/${f})`;
        return note ? `> ${note}\n>\n> ${link}` : `> ${link}`;
    },
    ProtocolGrid: ({ protocols = PROTOCOL_ORDER, link = 'page' }) =>
        protocols
            .map((slug) => {
                const p = protocolSite(slug);
                const href =
                    link === 'tool' ? p.toolHref : link === 'docs' ? p.docsHref : p.pageHref;
                return `- [${p.label}](${href}) (${p.verb}): ${p.line} Nostr kind ${p.kinds}.`;
            })
            .join('\n'),
    EmbeddedOpenAPI: ({ url, caption }) => `OpenAPI: [${caption ?? url}](${url})`,
    SignInButtonHosts: () => null,
    SignInButtonBrand: () => null,
    MarkVariants: () => null,
};

// ── links ───────────────────────────────────────────────────────────────────

/** A link as the rendered page resolves it, made absolute: `/me/sdk` is ochk.io/docs/me/sdk. */
export function absoluteUrl(url, route) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) return url;
    const u = new URL(url, `http://docs.invalid${route}`);
    const path = u.pathname === '/' ? '' : u.pathname;
    return `${SITE_URL}${path}${u.search}${u.hash}`;
}

// ── markdown ────────────────────────────────────────────────────────────────

const lineStart = (src, i) => src.lastIndexOf('\n', i - 1) + 1;

/** Past the end of this line and any blank lines after it. */
function pastBlankLines(src, i) {
    let j = i;
    for (;;) {
        const nl = src.indexOf('\n', j);
        const end = nl === -1 ? src.length : nl;
        if (src.slice(j, end).trim() !== '') return j;
        if (nl === -1) return src.length;
        j = nl + 1;
    }
}

// TypeDoc's text escapes ("\&lt;", "&#123;") and its property anchors, as rehype-typedoc reads them.
const TYPEDOC_ANCHOR = /\\?&lt;a id="[^"]*"\\?(?:>|&gt;)\\?&lt;\/a\\?(?:>|&gt;)\s*/g;
const ENTITY = /\\?&(?:#(\d+)|#x([0-9a-f]+)|(lt|gt|amp|quot));/gi;
const NAMED = { lt: '<', gt: '>', amp: '&', quot: '"' };
const typedocText = (s) =>
    s
        .replace(TYPEDOC_ANCHOR, '')
        .replace(ENTITY, (_, dec, hex, name) =>
            dec
                ? String.fromCodePoint(Number(dec))
                : hex
                  ? String.fromCodePoint(parseInt(hex, 16))
                  : NAMED[name.toLowerCase()]
        );

/**
 * One page's MDX as plain markdown.
 *
 * @param {string} src the page's source
 * @param {{ route: string, file: string, root: string }} at where it lives
 * @returns {{ title?: string, description?: string, markdown: string, unknown: string[] }}
 */
export function toMarkdown(src, { route, file, root }) {
    const tree = processor.parse(src);
    const meta = readMetadata(tree);
    const sdk = isSdkReference(route);
    const edits = [];
    const unknown = [];
    const includes = {};

    const start = (n) => n.position.start.offset;
    const end = (n) => n.position.end.offset;
    const removeBlock = (n) => {
        const s = start(n);
        const from = src.slice(lineStart(src, s), s).trim() === '' ? lineStart(src, s) : s;
        edits.push([from, pastBlankLines(src, end(n)), '']);
    };
    const replace = (n, text) => {
        const indent = ' '.repeat(n.position.start.column - 1);
        edits.push([start(n), end(n), text.split('\n').join('\n' + indent)]);
    };

    // A page's MDX includes, e.g. `import MeClientCdn from '@/generated/me-client-cdn.mdx'`.
    for (const node of tree.children) {
        if (node.type !== 'mdxjsEsm') continue;
        for (const m of node.value.matchAll(/import\s+(\w+)\s+from\s+['"]([^'"]+\.mdx?)['"]/g)) {
            const spec = m[2];
            includes[m[1]] = spec.startsWith('@/')
                ? join(root, 'src', spec.slice(2))
                : resolve(dirname(file), spec);
        }
    }

    // TypeDoc's breadcrumbs above the h1 repeat the docs' own.
    const dropped = new Set();
    if (sdk) {
        const h1 = tree.children.findIndex((n) => n.type === 'heading' && n.depth === 1);
        for (const n of tree.children.slice(0, Math.max(0, h1))) {
            if (n.type === 'mdxjsEsm') continue;
            removeBlock(n);
            dropped.add(n);
        }
    }

    const relink = (node) => {
        const abs = absoluteUrl(node.url, route);
        if (abs === node.url) return;
        const s = start(node);
        const slice = src.slice(s, end(node));
        const marks = node.type === 'definition' ? [']: ', ']:'] : ['](', '](<'];
        for (const mark of marks) {
            const i =
                node.type === 'definition'
                    ? slice.indexOf(mark + node.url)
                    : slice.lastIndexOf(mark + node.url);
            if (i === -1) continue;
            const at = s + i + mark.length;
            edits.push([at, at + node.url.length, abs]);
            return;
        }
    };

    const visit = (node) => {
        if (dropped.has(node)) return;
        switch (node.type) {
            case 'mdxjsEsm':
            case 'mdxFlowExpression':
                removeBlock(node);
                return;
            case 'mdxTextExpression':
                edits.push([start(node), end(node), '']);
                return;
            case 'code':
            case 'inlineCode':
                return;
            case 'link':
            case 'image':
            case 'definition':
                relink(node);
                break;
            case 'text':
                if (sdk) {
                    const raw = src.slice(start(node), end(node));
                    const clean = typedocText(raw);
                    if (clean !== raw) edits.push([start(node), end(node), clean]);
                }
                return;
            case 'mdxJsxFlowElement':
            case 'mdxJsxTextElement': {
                const name = node.name ?? '';
                if (includes[name]) {
                    const inc = readFileSync(includes[name], 'utf8');
                    const md = toMarkdown(inc, { route, file: includes[name], root });
                    unknown.push(...md.unknown);
                    return replace(node, md.markdown.trimEnd());
                }
                if (Object.hasOwn(COMPONENTS, name)) {
                    const text = COMPONENTS[name](attributes(node));
                    if (text === null) {
                        if (node.type === 'mdxJsxFlowElement') removeBlock(node);
                        else edits.push([start(node), end(node), '']);
                    } else replace(node, text);
                    return;
                }
                // Anything else is a wrapper: keep what it wraps.
                unknown.push(name);
                const kids = node.children ?? [];
                if (kids.length === 0) {
                    if (node.type === 'mdxJsxFlowElement') removeBlock(node);
                    else edits.push([start(node), end(node), '']);
                    return;
                }
                edits.push([start(node), start(kids[0]), '']);
                edits.push([end(kids.at(-1)), end(node), '']);
                break;
            }
        }
        for (const child of node.children ?? []) visit(child);
    };
    visit(tree);

    edits.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    let out = '';
    let at = 0;
    for (const [s, e, text] of edits) {
        if (s < at) throw new Error(`gen-llms: overlapping edits in ${route} at ${s}`);
        out += src.slice(at, s) + text;
        at = e;
    }
    out += src.slice(at);
    return { ...meta, markdown: out.trim() + '\n', unknown };
}

// ── the files ───────────────────────────────────────────────────────────────

/** A page's section: the folder under src/pages it sits in, '' for a page at the top. */
const sectionOf = (rel) => {
    const parts = rel.split('/');
    return parts.length > 3 ? parts[2] : '';
};

/** Root first, then getting-started, then the rest by name; an index page leads its section. */
function sortPages(a, b) {
    const sa = a.section;
    const sb = b.section;
    const rank = (s) => (s === '' ? 0 : s === 'getting-started' ? 1 : 2);
    if (sa !== sb) return rank(sa) - rank(sb) || (sa < sb ? -1 : 1);
    const ia = a.route === `/${sa}` || a.route === '/';
    const ib = b.route === `/${sb}` || b.route === '/';
    if (ia !== ib) return ia ? -1 : 1;
    return a.route < b.route ? -1 : a.route > b.route ? 1 : 0;
}

const entry = (p) =>
    `- [${p.title}](${SITE_URL}/${copyPath(p.route)})${p.description ? `: ${p.description}` : ''}`;

/**
 * Every output, keyed by its path under public/. Reads the pages; writes nothing.
 *
 * @param {string} root the repo root
 */
export function generate(root = process.cwd()) {
    const pages = listPages(root)
        .filter((p) => p.rel.endsWith('.mdx'))
        .map((p) => {
            const md = toMarkdown(p.src, { route: p.route, file: p.abs, root });
            const h1 = md.markdown.match(/^# (.+)$/m)?.[1];
            return {
                route: p.route,
                section: sectionOf(p.rel),
                ...md,
                title: md.title ?? h1 ?? p.route,
            };
        })
        .sort(sortPages);

    const written = pages.filter((p) => !isSdkReference(p.route));
    const reference = pages.filter((p) => /^\/sdk\/.+\/README$/.test(p.route));
    const home = pages.find((p) => p.route === '/');

    const head = ['# orangecheck docs', '', `> ${home?.description ?? ''}`, ''];
    const sections = [];
    for (const p of written) {
        const seg = p.section;
        if (sections.at(-1)?.seg !== seg) sections.push({ seg, pages: [] });
        sections.at(-1).pages.push(p);
    }
    const llms = [
        ...head,
        `Each link below is a page as plain markdown. Every written page in one file: ${SITE_URL}/llms-full.txt`,
        '',
        ...sections.flatMap(({ seg, pages: ps }) => [
            `## /docs${seg ? `/${seg}` : ''}`,
            '',
            ...ps.map(entry),
            '',
        ]),
        '## Optional',
        '',
        ...reference.map(entry),
        '',
    ].join('\n');

    const full =
        [
            ...head,
            ...written.flatMap((p) => ['---', '', `URL: ${pageUrl(p.route)}`, '', p.markdown]),
        ]
            .join('\n')
            .trimEnd() + '\n';

    const files = new Map([
        ['llms.txt', llms],
        ['llms-full.txt', full],
    ]);
    for (const p of pages) files.set(copyPath(p.route), p.markdown);
    const unknown = [...new Set(pages.flatMap((p) => p.unknown))].sort();
    return { files, pages, unknown };
}

function main() {
    const root = process.cwd();
    const { files, pages, unknown } = generate(root);
    for (const [path, body] of files) {
        const out = join(root, 'public', path);
        mkdirSync(dirname(out), { recursive: true });
        writeFileSync(out, body);
    }
    const kb = (p) => (Buffer.byteLength(files.get(p)) / 1024).toFixed(0);
    console.log(
        `[gen-llms] ${pages.length} pages → public/llms.txt (${kb('llms.txt')} KB), ` +
            `public/llms-full.txt (${kb('llms-full.txt')} KB), ${pages.length} .md copies`
    );
    if (unknown.length)
        console.warn(`[gen-llms] components kept as wrappers: ${unknown.join(', ')}`);
}

// Run as a script, not when a test imports it.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
