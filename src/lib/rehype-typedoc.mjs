// TypeDoc's pages under /sdk/<package>/ are generated and synced by a bot, so
// what they get wrong is read here rather than edited there:
//  - its breadcrumb lines above the h1 repeat the docs' own breadcrumbs;
//  - `\&lt;`, `\&#123;` reach the page as the literal text "&lt;", "&#123;";
//  - `&lt;a id="property-x">&lt;/a>` reaches it as text, so a link to
//    `Interface#property-x` had no target;
//  - a type on a line of its own ("Returns") is a run of code spans, each a
//    pill; it reads as one type in mono.
// It runs after rehype-slug, so every heading keeps the id it had.
const ENTITY = /&(?:#(\d+)|#x([0-9a-f]+)|(lt|gt|amp|quot));/gi;
const NAMED = { lt: '<', gt: '>', amp: '&', quot: '"' };
const ANCHOR = /<a id="([^"]+)"><\/a>\s*/g;
const SKIP = new Set(['code', 'pre', 'script', 'style']);

const decode = (s) =>
    s.replace(ENTITY, (_, dec, hex, name) =>
        dec
            ? String.fromCodePoint(Number(dec))
            : hex
              ? String.fromCodePoint(parseInt(hex, 16))
              : NAMED[name.toLowerCase()]
    );

function text(value) {
    const out = [];
    let last = 0;
    for (const m of value.matchAll(ANCHOR)) {
        if (m.index > last) out.push({ type: 'text', value: decode(value.slice(last, m.index)) });
        out.push({
            type: 'element',
            tagName: 'span',
            properties: { id: m[1], className: ['scroll-mt-28'] },
            children: [],
        });
        last = m.index + m[0].length;
    }
    if (last < value.length) out.push({ type: 'text', value: decode(value.slice(last)) });
    return out;
}

function walk(node) {
    if (!node.children) return;
    if (node.type === 'element' && SKIP.has(node.tagName)) return;
    const next = [];
    for (const child of node.children) {
        if (child.type === 'text' && /[&<]/.test(child.value)) next.push(...text(child.value));
        else {
            walk(child);
            next.push(child);
        }
    }
    node.children = next;
}

const isH1 = (n) => n.type === 'element' && n.tagName === 'h1';

const PUNCT = /^[\s<>|&[\]{}(),;:.?=*-]*$/;
const isCode = (n) => n.type === 'element' && n.tagName === 'code';
const typePart = (n) =>
    isCode(n) ||
    (n.type === 'text' && PUNCT.test(n.value)) ||
    (n.type === 'element' &&
        n.tagName === 'a' &&
        n.children.every((c) => isCode(c) || c.type === 'text'));
const TYPE_LINE = [
    'font-mono',
    'text-[0.875rem]',
    'md:text-[0.875rem]',
    'text-foreground',
    '[&_code]:bg-transparent',
    '[&_code]:p-0',
    '[&_code]:text-[1em]',
];

function typeLines(node) {
    for (const child of node.children ?? []) {
        if (child.type !== 'element') continue;
        if (
            child.tagName === 'p' &&
            child.children.some(isCode) &&
            child.children.every(typePart)
        ) {
            child.properties = { ...child.properties, className: TYPE_LINE };
        } else if (!SKIP.has(child.tagName)) typeLines(child);
    }
}

export default function rehypeTypedoc() {
    return (tree, file) => {
        const path = String(file?.path ?? '').replaceAll('\\', '/');
        if (!/\/src\/pages\/sdk\/[^/]+\//.test(path)) return;
        const first = tree.children.findIndex(isH1);
        if (first > 0) {
            const lead = tree.children.slice(0, first);
            const esm = (n) => n.type === 'mdxjsEsm';
            const preamble = lead.every(
                (n) =>
                    esm(n) ||
                    (n.type === 'text' && !n.value.trim()) ||
                    (n.type === 'element' && (n.tagName === 'p' || n.tagName === 'hr'))
            );
            if (preamble) tree.children = [...lead.filter(esm), ...tree.children.slice(first)];
        }
        walk(tree);
        typeLines(tree);
    };
}
