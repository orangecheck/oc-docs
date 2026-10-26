#!/usr/bin/env node
/*
 * Writes src/generated/me-client-cdn.mdx, which git ignores: the sign-in button
 * page's jsDelivr snippet (src/content/sign-in-button-cdn.html), pinned to the
 * @orangecheck/me-client version installed here, with the Subresource Integrity
 * hash of each file it loads. yarn checked the installed files against
 * yarn.lock, so they are the bytes npm publishes. It runs before dev, test and
 * build, so the page always pins the release this build installed, and a
 * me-client bump is the dependency alone.
 *
 *   node scripts/me-client-sri.mjs              write the snippet
 *   node scripts/me-client-sri.mjs --check-cdn  and refuse unless jsDelivr serves the same bytes
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const FILES = ['button-auto.mjs', 'button.css'];
const root = new URL('..', import.meta.url).pathname;
const pkg = join(root, 'node_modules/@orangecheck/me-client');
const { version } = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8'));
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error(`me-client version ${version} is not x.y.z`);
const base = `https://cdn.jsdelivr.net/npm/@orangecheck/me-client@${version}/dist`;
const sri = (bytes) => `sha384-${createHash('sha384').update(bytes).digest('base64')}`;
const integrity = Object.fromEntries(
    FILES.map((f) => [f, sri(readFileSync(join(pkg, 'dist', f)))])
);

if (process.argv.includes('--check-cdn')) {
    for (const f of FILES) {
        const r = await fetch(`${base}/${f}`);
        if (!r.ok) throw new Error(`${base}/${f}: HTTP ${r.status}`);
        if (sri(Buffer.from(await r.arrayBuffer())) !== integrity[f]) {
            throw new Error(`jsDelivr serves other bytes for ${f} than npm's me-client ${version}`);
        }
    }
}

const template = readFileSync(join(root, 'src/content/sign-in-button-cdn.html'), 'utf8');
const html = template.replace(/\{\{(base|integrity:([^}]+))\}\}/g, (token, key, file) => {
    if (key === 'base') return base;
    if (!Object.hasOwn(integrity, file)) throw new Error(`no hash for ${token}`);
    return integrity[file];
});
for (const f of FILES) {
    if (!html.includes(`${base}/${f}"\n    integrity="${integrity[f]}"`)) {
        throw new Error(`src/content/sign-in-button-cdn.html loads ${f} without its pin`);
    }
}
mkdirSync(join(root, 'src/generated'), { recursive: true });
writeFileSync(join(root, 'src/generated/me-client-cdn.mdx'), `\`\`\`html\n${html}\`\`\`\n`);
console.log(
    `me-client ${version}: sign-in button snippet written${process.argv.includes('--check-cdn') ? ', jsDelivr matches' : ''}`
);
