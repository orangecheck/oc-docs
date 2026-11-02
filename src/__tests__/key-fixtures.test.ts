// scripts/check-key-fixtures.mjs against a scratch repository: a commit that adds a
// private-key header is refused, even when a later commit removes it again, and a
// multi-line value not shaped like a key passes. land.sh runs it before it pushes.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

// Built from parts, so this file adds no key header itself.
const HEADER = ['-----BEGIN', 'OPENSSH', 'PRIVATE KEY-----'].join(' ');

const git = (dir: string, ...args: string[]) =>
    spawnSync(
        'git',
        ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', ...args],
        {
            encoding: 'utf8',
        }
    );

/** A repository with one base commit, tagged `base`, then `commits` of [file, content]. */
function repo(commits: [string, string][]) {
    const dir = mkdtempSync(join(tmpdir(), 'key-fixtures-'));
    git(dir, 'init', '-q');
    writeFileSync(join(dir, 'README.md'), 'base\n');
    git(dir, 'add', '.');
    git(dir, 'commit', '-q', '-m', 'base');
    git(dir, 'tag', 'base');
    for (const [file, content] of commits) {
        writeFileSync(join(dir, file), content);
        git(dir, 'add', '.');
        git(dir, 'commit', '-q', '-m', `edit ${file}`);
    }
    return dir;
}

const check = (dir: string) =>
    spawnSync('node', [resolve('scripts/check-key-fixtures.mjs'), 'base..HEAD'], {
        cwd: dir,
        encoding: 'utf8',
    });

describe('scripts/check-key-fixtures.mjs', () => {
    it('refuses a commit that adds a private-key header to a test fixture', () => {
        const r = check(repo([['fixture.test.ts', `const KEY = ['${HEADER}', 'b3Bl'];\n`]]));
        expect(r.status).toBe(1);
        expect(r.stderr).toContain('fixture.test.ts');
        expect(r.stderr).toContain('history secret scan');
    });

    it('refuses it even when a later commit takes the header out again', () => {
        const r = check(
            repo([
                ['fixture.test.ts', `const KEY = ['${HEADER}'];\n`],
                ['fixture.test.ts', `const KEY = ['-----BEGIN TEST VALUE-----'];\n`],
            ])
        );
        expect(r.status).toBe(1);
    });

    it('passes a multi-line value that is not shaped like a key', () => {
        const value = `['-----BEGIN TEST VALUE-----', 'line', '-----END TEST VALUE-----']`;
        const r = check(repo([['fixture.test.ts', `const V = ${value};\n`]]));
        expect(r.status, r.stderr).toBe(0);
    });
});
