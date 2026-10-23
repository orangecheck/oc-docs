/**
 * Resolve every site-internal link in src/pages against the pages tree,
 * offline, so a broken link fails CI before it deploys.
 *
 * Why: the TypeDoc SDK pages shipped 838 links to `interfaces/Poll.mdx`-style
 * paths. The site routes `/sdk/<pkg>/interfaces/Poll`, so every one was a 404.
 * check-doc-links.mjs asks the live site, but only about absolute `/…` links,
 * so a relative link never reached it.
 *
 * A link passes when it resolves (the way a browser resolves it from the
 * page's own URL) to a page file, a file under public/, or the source of a
 * redirect in next.config.ts. Links ending in `.mdx` always fail.
 *
 * It also fails a link into an orangecheck repo a stranger cannot open. The
 * federation, custody and operator pages sent readers to a private repo's
 * files for months; to anyone outside the org each was a 404. A repo missing
 * from PUBLIC_REPOS counts as private, so a new private repo is caught without
 * anyone remembering to list it. Add a repo here only once it is public.
 *
 * Usage: node scripts/check-internal-links.mjs
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const PAGES = 'src/pages';
const ORIGIN = 'https://docs.ochk.io';

function walk(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) out.push(...walk(p));
        else out.push(p);
    }
    return out;
}

function routeOf(file) {
    const r = '/' + relative(PAGES, file).replace(/\.(mdx|md|tsx|ts|jsx|js)$/, '');
    if (r === '/index') return '/';
    return r.endsWith('/index') ? r.slice(0, -'/index'.length) : r;
}

const files = walk(PAGES).filter((f) => /\.(mdx|md|tsx)$/.test(f));
const routes = new Set(files.map(routeOf));

const redirects = new Set(
    [...readFileSync('next.config.ts', 'utf8').matchAll(/source:\s*'([^']+)'/g)].map((m) => m[1])
);

function resolves(path) {
    const p = path.length > 1 ? path.replace(/\/$/, '') : path;
    return routes.has(p) || redirects.has(p) || existsSync(join('public', p));
}

const PUBLIC_REPOS = new Set([
    '.github',
    'bitcoin',
    'oc-agent-examples',
    'oc-agent-protocol',
    'oc-attest-protocol',
    'oc-chat-protocol',
    'oc-docs',
    'oc-guardian-kit',
    'oc-load-vault-secrets-action',
    'oc-lock-protocol',
    'oc-media-kit',
    'oc-onboarding-examples',
    'oc-packages',
    'oc-pledge-protocol',
    'oc-portal-web',
    'oc-relay-infra',
    'oc-stamp-protocol',
    'oc-vault-extension',
    'oc-vote-examples',
    'oc-vote-protocol',
]);
const ORG_REPO = /github\.com\/orangecheck\/([A-Za-z0-9._-]+)/g;

// Markdown link targets and JSX href="…" values.
const LINK_RES = [/\]\(([^)\s]+)\)/g, /href=["']([^"']+)["']/g];
const FENCE = /^\s*(```|~~~)/;

const failures = [];
let checked = 0;
for (const file of files) {
    const route = routeOf(file);
    // Resolve like a browser does from the page's served URL (no trailing slash).
    const base = new URL(route, ORIGIN);
    let inFence = false;
    readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
            // In code too: a `git clone` of a private repo fails a stranger the same way.
            for (const m of line.matchAll(ORG_REPO)) {
                const repo = m[1].replace(/\.+$/, '').replace(/\.git$/, ''); // a sentence's full stop is not the name
                if (!PUBLIC_REPOS.has(repo)) {
                    failures.push(`${file}:${i + 1}  ${m[0]}  (private repo: a reader gets a 404)`);
                }
            }
            if (FENCE.test(line)) inFence = !inFence;
            if (inFence) return;
            for (const re of LINK_RES) {
                for (const m of line.matchAll(re)) {
                    const target = m[1];
                    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) continue;
                    if (target.startsWith('//')) continue;
                    if (/[{}$<>]/.test(target)) continue; // JSX expression, not a literal link
                    const url = new URL(target, base);
                    if (url.origin !== ORIGIN) continue;
                    checked++;
                    const where = `${file}:${i + 1}`;
                    if (/\.mdx?$/.test(url.pathname)) {
                        failures.push(`${where}  ${target}  (links to a source file, not a route)`);
                    } else if (!resolves(decodeURIComponent(url.pathname))) {
                        failures.push(
                            `${where}  ${target}  (resolves to ${url.pathname}: no page)`
                        );
                    }
                }
            }
        });
}

console.log(`internal links: ${checked} checked · ${failures.length} broken`);
for (const f of failures) console.log(`  ${f}`);
if (failures.length > 0) process.exitCode = 1;
