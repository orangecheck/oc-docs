#!/usr/bin/env node
/**
 * Build-time generator forthe fleet catalogs that the docs hub
 * embeds: reasons, webhook events.
 *
 * Why: fleet.ochk.io maintains the typed source of truth at
 *   src/server/api/reasons.ts
 *   src/lib/webhooks/events.ts
 * and surfaces JSON projections at /api/reasons and /api/webhook-events.
 *
 * Until this script existed, docs.ochk.io's /fleet/api page and
 * /fleet/webhooks page hand-maintained tables that mirrored the
 * typed catalog. Those drift the moment a new reason or event_type
 * lands on fleet without someone remembering to update mdx.
 *
 * This script runs as `prebuild`. It fetches the JSON from prod and
 * writes a static asset under src/generated/. On Vercel that runs
 * during the build step, before `next build`. Locally `yarn build`
 * does the same. `yarn dev` skips it (the existing generated file is
 * checked in so dev and CI work without network).
 *
 * Defensive: if the fetch fails (fleet down, dev offline, etc.) we
 * keep whatever's currently in the generated file. Build doesn't
 * fail; the page renders the cached catalog. Worst case is staleness
 * for one deploy cycle.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'src/generated');
const OUT_PATH = join(OUT_DIR, 'fleet-catalogs.json');

const SOURCES = [
    {
        key: 'reasons',
        url: 'https://fleet.ochk.io/api/reasons',
        responseField: 'reasons',
    },
    {
        key: 'webhookEvents',
        url: 'https://fleet.ochk.io/api/webhook-events',
        responseField: 'events',
    },
];

async function readExisting() {
    try {
        const buf = await readFile(OUT_PATH, 'utf8');
        return JSON.parse(buf);
    } catch {
        return { reasons: [], webhookEvents: [], fetchedAt: null, source: 'fallback-empty' };
    }
}

async function fetchSource(src) {
    const r = await fetch(src.url, {
        signal: AbortSignal.timeout(5_000),
    });
    if (!r.ok) {
        throw new Error(`HTTP ${r.status} from ${src.url}`);
    }
    const body = await r.json();
    if (!body[src.responseField] || !Array.isArray(body[src.responseField])) {
        throw new Error(`Missing ${src.responseField} array in response from ${src.url}`);
    }
    return body[src.responseField];
}

async function main() {
    const existing = await readExisting();
    const next = {
        ...existing,
        fetchedAt: new Date().toISOString(),
        source: 'fetched',
    };

    let anyFailed = false;
    for (const src of SOURCES) {
        try {
            const data = await fetchSource(src);
            next[src.key] = data;
            console.log(`[gen-catalogs] ${src.key}: ${data.length} entries from ${src.url}`);
        } catch (err) {
            anyFailed = true;
            console.warn(
                `[gen-catalogs] ${src.key}: fetch failed (${err.message}); keeping cached entries`
            );
        }
    }

    if (anyFailed && next.source === 'fetched') {
        next.source = 'fetched-partial';
    }

    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(OUT_PATH, JSON.stringify(next, null, 2) + '\n');
    console.log(`[gen-catalogs] wrote ${OUT_PATH}`);
}

await main();
