/**
 * Verify every concrete ochk.io URL the docs hand to a reader.
 *
 * Why: `attest/how-it-works.mdx` told readers to
 * `curl https://ochk.io/api/check?…` for months. That is the auth host and
 * serves no `/api/check`, so the one runnable command on the flagship verb's
 * explainer 404'd on first try. Nothing catches that — a broken URL inside a
 * fenced code block is just text to the build, to tsc and to Prettier.
 *
 * What counts as fine, and why each is not a failure:
 *   2xx        the page or endpoint answers
 *   3xx        redirect (docs link to a canonical path that moves)
 *   401 / 403  a gated surface answering correctly (owner consoles)
 *   405        a POST-only endpoint; this checker only issues GET
 *
 * Anything else fails the run, unless it is in EXPECTED_404 below — which is
 * for URLs the docs deliberately show as examples that cannot resolve (an
 * illustrative attestation id, a placeholder API key). Each entry needs a
 * reason, so the list cannot quietly become a dumping ground for real rot.
 *
 * Relative links are checked too, resolved against SITE. That matters: this
 * repo carries deliberate 308 redirects from a 2026-05-09 SDK restructure, so
 * `/sdks/gate` is a WORKING link that lands on `/sdk/gate/README`. Comparing
 * link paths against the pages tree locally — the obvious cheap approach —
 * calls those four broken and misses that `/sdk/me-client` really is a 404
 * (the package dirs hold README.mdx, not index.mdx). Asking the live site is
 * the only way to tell a redirect from a hole.
 *
 * Usage: node scripts/check-doc-links.mjs [--verbose]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PAGES = 'src/pages';
const SITE = process.env.OC_DOCS_SITE ?? 'https://docs.ochk.io';
const TIMEOUT_MS = 20_000;

/** URLs that are SUPPOSED to fail — illustrative, not navigational. */
const EXPECTED_404 = new Map([
    ['https://ochk.io/a/a3f5b8c2', 'illustrative attestation id in an example payload'],
    ['https://ochk.io/api/*', 'a glob in prose describing the API surface, not a URL'],
    ['https://me.ochk.io/api/', 'prose reference to the API root, not an endpoint'],
    [
        'https://me.ochk.io/api/integrator/config?project_key=pk_live_yourco',
        'placeholder project key — pk_live_yourco is not a real integrator',
    ],
    [
        'https://attest.ochk.io/api/check?addr=bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080',
        'the quickstart deliberately shows the never-attested case, which is a 404 by design',
    ],
]);

const PLACEHOLDER = /[<>{}$]|\.\.\.|…/;
// \S excludes newlines: without it the match ran past the end of the line
// and swallowed the next line's text into the URL, producing phantom 404s.
const URL_RE = /https:\/\/[a-z0-9.-]*ochk\.io[^\s"'`)\]]*/g;
// Markdown links to a site-absolute path: [text](/attest/quickstart)
const REL_RE = /\]\((\/[^\s")]*)\)/g;

function walk(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) out.push(...walk(p));
        else if (name.endsWith('.mdx') || name.endsWith('.tsx')) out.push(p);
    }
    return out;
}

const found = new Map(); // url -> Set(file)
for (const file of walk(PAGES)) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(URL_RE)) {
        const url = m[0].replace(/[.,;]+$/, '');
        if (!found.has(url)) found.set(url, new Set());
        found.get(url).add(file);
    }
    for (const m of text.matchAll(REL_RE)) {
        const path = m[1];
        // A bare #anchor is in-page; nothing to resolve.
        if (path.startsWith('/#')) continue;
        const url = SITE + path.split('#')[0];
        if (!found.has(url)) found.set(url, new Set());
        found.get(url).add(file);
    }
}

const verbose = process.argv.includes('--verbose');
let ok = 0;
let skipped = 0;
const failures = [];

for (const [url, files] of [...found].sort()) {
    if (PLACEHOLDER.test(url)) {
        skipped++;
        continue;
    }
    let status = 0;
    try {
        const ctl = new AbortController();
        const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
        const res = await fetch(url, { redirect: 'follow', signal: ctl.signal }).finally(() =>
            clearTimeout(t)
        );
        status = res.status;
    } catch {
        status = 0; // network failure / timeout
    }

    const acceptable =
        (status >= 200 && status < 400) || status === 401 || status === 403 || status === 405;

    if (acceptable) {
        ok++;
        if (verbose) console.log(`  ${status}  ${url}`);
    } else if (EXPECTED_404.has(url)) {
        skipped++;
        if (verbose) console.log(`  ${status}  ${url}  (expected: ${EXPECTED_404.get(url)})`);
    } else {
        failures.push({ url, status, files: [...files] });
    }
}

console.log(
    `\ndoc links: ${ok} ok · ${skipped} skipped (placeholder or expected) · ${failures.length} broken`
);
for (const f of failures) {
    console.log(`\n  BROKEN ${f.status || 'no-response'}  ${f.url}`);
    for (const file of f.files) console.log(`      ${file}`);
}
if (failures.length > 0) {
    console.log(
        '\nIf a URL is meant to be illustrative rather than navigable, add it to\n' +
            'EXPECTED_404 in this script with a reason.\n'
    );
    process.exitCode = 1;
}
