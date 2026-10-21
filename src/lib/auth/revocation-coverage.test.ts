import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Every place that turns a token into a session must pass the origin gate and
 * ask whether the auth host ended the session. The docs have no such place:
 * their pages ask ochk.io's /api/auth/me. So the property here is that nothing
 * reads a token itself; a module that does must use site-kit's
 * `createSessionReader`, which does both.
 */
const READS_TOKEN =
    /\b(verifySessionToken|verifyOcToken|resolveSessionFromRequest|getOcSession|readAllSessionCookies)\s*\(/;

function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return walk(path);
        return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
    });
}

describe('nothing in the docs reads a session token itself', () => {
    const root = process.cwd();
    const files = walk(join(root, 'src')).map((p) => p.slice(root.length + 1));

    it('scans the source · the scan is not vacuously passing', () => {
        expect(files).toContain('src/pages/_app.tsx');
    });

    it('finds no token reader', () => {
        const direct = files.filter((f) =>
            READS_TOKEN.test(stripComments(readFileSync(join(root, f), 'utf8')))
        );
        expect(direct).toEqual([]);
    });
});
