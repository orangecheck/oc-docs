#!/usr/bin/env node
/**
 * Add a banner to each hand-curated SDK page pointing to the
 * auto-generated /sdk/<pkg> reference. Preserves the existing curated
 * narrative — the banner just makes clear that the docs site's
 * /sdk/<pkg> tree is now the source-of-truth for API surface.
 *
 * Idempotent. Marker is the literal "> **Full reference:" string.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PAGES_ROOT = resolve(HERE, '..', 'src', 'pages');
const MARKER = '> **Full reference:';

const TARGETS = [
    { file: 'sdks/javascript.mdx', pkg: 'sdk' },
    { file: 'sdks/gate.mdx', pkg: 'gate' },
    { file: 'sdks/react.mdx', pkg: 'react' },
    { file: 'sdks/wallet-adapter.mdx', pkg: 'wallet-adapter' },
    { file: 'me/sdk.mdx', pkg: 'me-client' },
    { file: 'vote/api.mdx', pkg: 'vote-core' },
];

let touched = 0;
let skipped = 0;
for (const { file, pkg } of TARGETS) {
    const path = resolve(PAGES_ROOT, file);
    if (!existsSync(path)) {
        console.error(`  ! ${file} not found`);
        continue;
    }
    const raw = readFileSync(path, 'utf8');
    if (raw.includes(MARKER)) {
        skipped++;
        continue;
    }

    // Insert banner after the first H1.
    const lines = raw.split('\n');
    let h1Idx = -1;
    for (let i = 0; i < Math.min(lines.length, 30); i++) {
        if (/^#\s/.test(lines[i])) {
            h1Idx = i;
            break;
        }
    }
    if (h1Idx < 0) {
        console.error(`  ! ${file}: no H1 found`);
        continue;
    }

    const banner = [
        '',
        `> **Full reference:** [docs.ochk.io/sdk/${pkg}](/sdk/${pkg}) — auto-generated from the TypeScript source on every release.`,
        '> The narrative below is the curated overview; the SDK reference page is the source of truth for every export, type, and signature.',
        '',
    ];

    const updated = [
        ...lines.slice(0, h1Idx + 1),
        ...banner,
        ...lines.slice(h1Idx + 1),
    ].join('\n');

    writeFileSync(path, updated);
    touched++;
    console.log(`  + ${file} → /sdk/${pkg}`);
}
console.log(`\n[curated-banner] stamped ${touched}, already-stamped ${skipped}`);
