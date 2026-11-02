// scripts/check-doc-links.mjs run against a scratch pages tree with fetch stubbed, so
// no request leaves the box: an EXPECTED_404 entry that pins a status fails the run on
// any other answer, a 5xx or a timeout included, and a prose entry is still skipped.
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import { classify, EXPECTED_404 } from '../../scripts/doc-link-expect.mjs';

const NEVER_ATTESTED =
    'https://attest.ochk.io/api/check?addr=bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080';
const INTEGRATOR = 'https://me.ochk.io/api/integrator/config?project_key=pk_live_yourco';
const API_ROOT = 'https://me.ochk.io/api/';

// Answers each URL with the status STUB_STATUS gives it; 0 throws, as a timeout does.
const STUB = `
const statuses = JSON.parse(process.env.STUB_STATUS);
globalThis.fetch = async (url) => {
    const status = statuses[String(url)] ?? 200;
    if (status === 0) throw new Error('timed out');
    return new Response(null, { status });
};
`;

/** Runs the checker over one page that names `urls`, each answering its stubbed status. */
function run(statuses: Record<string, number>) {
    const dir = mkdtempSync(join(tmpdir(), 'doc-links-'));
    mkdirSync(join(dir, 'src/pages'), { recursive: true });
    writeFileSync(join(dir, 'src/pages/page.mdx'), Object.keys(statuses).join('\n\n') + '\n');
    writeFileSync(join(dir, 'stub.mjs'), STUB);
    return spawnSync(
        'node',
        [
            '--import',
            pathToFileURL(join(dir, 'stub.mjs')).href,
            resolve('scripts/check-doc-links.mjs'),
        ],
        {
            cwd: dir,
            encoding: 'utf8',
            env: { ...process.env, STUB_STATUS: JSON.stringify(statuses) },
        }
    );
}

describe('scripts/check-doc-links.mjs expected entries', () => {
    it('pins the two entries that name live endpoints, and only those', () => {
        expect(EXPECTED_404.get(NEVER_ATTESTED)?.status).toBe(404);
        expect(EXPECTED_404.get(INTEGRATOR)?.status).toBe(404);
        expect(EXPECTED_404.get(API_ROOT)?.status).toBeUndefined();
    });

    it('skips a pinned entry that answers its status', () => {
        const r = run({ [NEVER_ATTESTED]: 404, [INTEGRATOR]: 404 });
        expect(r.status, r.stdout).toBe(0);
        expect(r.stdout).toContain('0 ok · 2 skipped');
    });

    it.each([500, 502, 503])('fails the run when a pinned entry answers %i', (status) => {
        const r = run({ [NEVER_ATTESTED]: status });
        expect(r.status).toBe(1);
        expect(r.stdout).toContain(`BROKEN ${status}  ${NEVER_ATTESTED}  (pinned to 404)`);
    });

    it.each([200, 400, 401])('fails the run when a pinned entry answers %i instead', (status) => {
        const r = run({ [INTEGRATOR]: status });
        expect(r.status).toBe(1);
        expect(r.stdout).toContain(`BROKEN ${status}  ${INTEGRATOR}  (pinned to 404)`);
    });

    it('fails the run when a pinned entry does not answer', () => {
        const r = run({ [NEVER_ATTESTED]: 0 });
        expect(r.status).toBe(1);
        expect(r.stdout).toContain(`BROKEN no-response  ${NEVER_ATTESTED}  (pinned to 404)`);
    });

    it('still skips a prose entry whatever it answers', () => {
        const r = run({ [API_ROOT]: 500 });
        expect(r.status, r.stdout).toBe(0);
        expect(r.stdout).toContain('1 skipped');
    });

    it('fails an unlisted URL that answers 404, and passes one behind a sign-in', () => {
        const r = run({ 'https://ochk.io/gone': 404, 'https://ochk.io/admin': 401 });
        expect(r.status).toBe(1);
        expect(r.stdout).toContain('1 ok · 0 skipped (placeholder or expected) · 1 broken');
        expect(r.stdout).toContain('BROKEN 404  https://ochk.io/gone\n');
    });
});

describe('classify', () => {
    const pinned = new Map([['https://x.ochk.io/p', { status: 404, reason: 'test' }]]);

    it('counts a pinned URL as expected only on its own status', () => {
        expect(classify('https://x.ochk.io/p', 404, pinned)).toBe('expected');
        for (const s of [0, 200, 302, 401, 403, 405, 500]) {
            expect(classify('https://x.ochk.io/p', s, pinned)).toBe('broken');
        }
    });

    it('keeps the acceptable statuses for an unlisted URL', () => {
        for (const s of [200, 301, 401, 403, 405])
            expect(classify('https://ochk.io', s)).toBe('ok');
        for (const s of [0, 400, 404, 500]) expect(classify('https://ochk.io', s)).toBe('broken');
    });
});
