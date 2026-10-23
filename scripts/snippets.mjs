// The code fences in the docs' MDX pages, with where they are and what they import.
// Shared by check-snippets.mjs; run alone for an inventory: node scripts/snippets.mjs
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export const PAGES = 'src/pages';
// Generated TypeDoc pages quote the package's own JSDoc; oc-packages owns those.
export const GENERATED = /^src\/pages\/sdk\/[^/]+\//;
export const TS_LANGS = new Set(['ts', 'typescript', 'tsx', 'js', 'javascript', 'jsx', 'mjs']);
export const PY_LANGS = new Set(['python', 'py']);
/** The fence marker that opts a block out: a fragment, or a sketch that is not meant to run. */
export const NO_CHECK = /(^|\s)no-check(\s|$)/;

function walk(dir) {
    const out = [];
    for (const name of readdirSync(dir).sort()) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) out.push(...walk(p));
        else if (/\.(mdx|md)$/.test(name)) out.push(p);
    }
    return out;
}

/** Every fenced block: file, 1-based line of the opening fence, lang, meta, code. */
export function fences(text, file) {
    const lines = text.split('\n');
    const out = [];
    for (let i = 0; i < lines.length; i++) {
        const open = /^(\s*)(`{3,}|~{3,})([^\s`]*)\s*(.*)$/.exec(lines[i]);
        if (!open) continue;
        const [, indent, mark, lang, meta] = open;
        const body = [];
        let j = i + 1;
        for (; j < lines.length; j++) {
            const close = new RegExp(`^\\s*${mark[0] === '`' ? '`' : '~'}{${mark.length},}\\s*$`);
            if (close.test(lines[j])) break;
            body.push(
                lines[j].startsWith(indent) ? lines[j].slice(indent.length) : lines[j].trimStart()
            );
        }
        out.push({
            file,
            line: i + 1,
            lang: lang.toLowerCase(),
            meta: meta.trim(),
            code: body.join('\n'),
        });
        i = j;
    }
    return out;
}

export function allFences() {
    const out = [];
    for (const file of walk(PAGES)) {
        if (GENERATED.test(file)) continue;
        out.push(...fences(readFileSync(file, 'utf8'), file));
    }
    return out;
}

export function kindOf(b) {
    if (TS_LANGS.has(b.lang)) return 'ts';
    if (PY_LANGS.has(b.lang)) return 'python';
    return 'other';
}

/** Bare module specifiers a TS/JS block imports or requires. */
export function tsImports(code) {
    const specs = new Set();
    for (const m of code.matchAll(/(?:^|\n)\s*import\s[^;]*?from\s+['"]([^'"]+)['"]/g))
        specs.add(m[1]);
    for (const m of code.matchAll(/(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g)) specs.add(m[1]);
    for (const m of code.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)) specs.add(m[1]);
    for (const m of code.matchAll(/\brequire\(\s*['"]([^'"]+)['"]\s*\)/g)) specs.add(m[1]);
    return [...specs];
}

/** Top-level modules a Python block imports. */
export function pyImports(code) {
    const mods = new Set();
    for (const m of code.matchAll(/^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w., ]+))/gm))
        for (const name of (m[1] ?? m[2]).split(',')) mods.add(name.trim().split(/[.\s]/)[0]);
    return [...mods];
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const blocks = allFences();
    const by = {};
    for (const b of blocks) {
        const k = kindOf(b);
        const imp = k === 'ts' ? tsImports(b.code) : k === 'python' ? pyImports(b.code) : [];
        const cls =
            k === 'other'
                ? 'other'
                : NO_CHECK.test(b.meta)
                  ? 'marked'
                  : imp.length
                    ? 'complete'
                    : 'fragment';
        const key = `${k}/${cls}`;
        by[key] = (by[key] ?? 0) + 1;
    }
    console.log(JSON.stringify({ blocks: blocks.length, ...by }, null, 1));
}
