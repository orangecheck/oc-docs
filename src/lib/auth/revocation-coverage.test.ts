import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Every place that turns a token into a session must ask whether the auth
 * host ended it. A signed-out token still verifies by signature for 30 days,
 * so a reader that skips the check is a way back in for exactly that token.
 *
 * Asserted as a property of the source, not of one reader: any non-test file
 * that verifies a token must call `familyRevocationCheck(` (a call, outside
 * comments), unless it is listed below with the reason it grants nothing.
 */
const VERIFIES = /\b(verifySessionToken|verifyOcToken|resolveSessionFromRequest|getOcSession)\s*\(/;
const CHECKS = /\bfamilyRevocationCheck\s*\(/;

const GRANTS_NOTHING: Record<string, string> = {};

function stripComments(src: string): string {
    return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return name === '__tests__' ? [] : walk(path);
        return /\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
    });
}

describe('every token reader asks whether the auth host ended the session', () => {
    const root = process.cwd();
    const readers = walk(join(root, 'src'))
        .map((p) => p.slice(root.length + 1))
        .filter((p) => VERIFIES.test(stripComments(readFileSync(join(root, p), 'utf8'))));

    it('finds the readers · the scan is not vacuously passing', () => {
        expect(readers).toContain('src/lib/auth/session.ts');
    });

    it.each(readers)('%s', (file) => {
        if (GRANTS_NOTHING[file]) return;
        const src = stripComments(readFileSync(join(root, file), 'utf8'));
        expect(
            CHECKS.test(src),
            `${file} verifies a token but never asks familyRevocationCheck`
        ).toBe(true);
    });
});
