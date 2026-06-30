// Build-time sitemap generator — the canonical OrangeCheck-family pattern.
//
// Modern best practice (Google/Bing 2024-2026):
//   - emit <loc> + <lastmod> ONLY; <changefreq>/<priority> are ignored, so dropped.
//   - lastmod must be the REAL content-change date, never the build clock —
//     always-today lastmod gets the whole site's freshness signal discounted.
//     We derive it from the git commit that last touched each page's source,
//     and OMIT lastmod when git can't tell us (omit > a fabricated date).
//   - same-host URLs only. No cross-domain <loc> (docs lives on docs.ochk.io).
//
// Routes are auto-enumerated from src/pages so the sitemap can never drift out
// of sync with the actual page tree. A route is included iff it is a static
// (non-[param]) page, is not infra/api, is not in EXCLUDE, and its source does
// not declare noindex — tying the sitemap to each page's own robots truth.
//
// Runs in `build` before `next build`; Vercel rebuilds on every push, so this
// keeps the sitemap current with zero cron. Deterministic output (stable sort,
// date-only lastmod) → re-running produces byte-identical bytes, no churn.

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// ── Per-site config (the ONLY part that differs across the family) ──────────
const SITE_URL = 'https://docs.ochk.io';
const EXCLUDE = []; // docs is fully public; only 404 (excluded by name) is noindexed
// ───────────────────────────────────────────────────────────────────────────

const PAGES_DIR = join(process.cwd(), 'src', 'pages');
const OUT = join(process.cwd(), 'public', 'sitemap.xml');
const PAGE_EXT = /\.(tsx|ts|jsx|js|mdx|md)$/;
const INFRA = /^(_app|_document|_error|404|500|sitemap.*|robots.*)$/;

function fileToRoute(absFile) {
    let r = relative(PAGES_DIR, absFile).split(sep).join('/');
    r = r.replace(PAGE_EXT, '');
    r = r.replace(/\/index$/, '').replace(/^index$/, '');
    return '/' + r; // '' -> '/', 'create' -> '/create'
}

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

// file (repo-relative, forward slashes) -> most recent commit date (YYYY-MM-DD)
function buildGitDateMap() {
    const map = new Map();
    try {
        // Best-effort deepen a shallow Vercel clone so stable pages still get a
        // real date; harmless (and ignored) on a complete local clone.
        try {
            execSync('git fetch --unshallow --quiet', { stdio: 'ignore' });
        } catch {
            /* already complete or no remote — fine */
        }
        const log = execSync('git log --name-only --format=%x01%cI', {
            encoding: 'utf8',
            maxBuffer: 256 * 1024 * 1024,
        });
        let cur = null;
        for (const line of log.split('\n')) {
            if (line.startsWith('\x01')) {
                cur = line.slice(1, 11); // %cI -> ISO; first 10 chars = YYYY-MM-DD
            } else if (line && cur && !map.has(line)) {
                map.set(line, cur); // first occurrence = most recent (log is reverse-chron)
            }
        }
    } catch {
        /* no git — every lastmod omitted, which is correct */
    }
    return map;
}

function main() {
    const gitDates = buildGitDateMap();
    const seen = new Set();
    const urls = [];

    for (const abs of walk(PAGES_DIR)) {
        const rel = relative(process.cwd(), abs).split(sep).join('/');
        const base = rel.split('/').pop().replace(PAGE_EXT, '');
        if (INFRA.test(base)) continue;
        if (rel.includes('[')) continue; // dynamic [param] route — not statically enumerable
        const route = fileToRoute(abs);
        if (EXCLUDE.some((ex) => route === ex || route.startsWith(ex + '/'))) continue;
        if (seen.has(route)) continue;
        let src = '';
        try {
            src = readFileSync(abs, 'utf8');
        } catch {
            /* unreadable — skip */
        }
        if (/noindex/i.test(src)) continue; // honor the page's own noindex declaration
        seen.add(route);
        urls.push({ route, lastmod: gitDates.get(rel) || null });
    }

    // Deterministic order: root first, then lexicographic.
    urls.sort((a, b) => (a.route === '/' ? -1 : b.route === '/' ? 1 : a.route < b.route ? -1 : 1));

    const body = urls
        .map(({ route, lastmod }) => {
            const loc = `${SITE_URL}${route === '/' ? '/' : route}`;
            const lm = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : '';
            return `  <url>\n    <loc>${loc}</loc>${lm}\n  </url>`;
        })
        .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>\n`;

    writeFileSync(OUT, xml);
    // eslint-disable-next-line no-console
    console.log(`[gen-sitemap] wrote ${urls.length} urls -> public/sitemap.xml`);
}

try {
    statSync(PAGES_DIR);
    main();
} catch (err) {
    // Never break the build over the sitemap — write a minimal valid one.
    // eslint-disable-next-line no-console
    console.warn(`[gen-sitemap] fell back to root-only sitemap: ${err?.message ?? err}`);
    writeFileSync(
        OUT,
        `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${SITE_URL}/</loc>\n  </url>\n</urlset>\n`
    );
}
