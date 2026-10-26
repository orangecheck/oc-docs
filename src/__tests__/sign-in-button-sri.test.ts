import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * The sign-in button page tells readers to load me-client from jsDelivr with
 * an exact version and Subresource Integrity hashes. They must describe the
 * files npm publishes: the installed package came from npm, checked against
 * the lockfile, so its files are the reference. scripts/me-client-sri.mjs
 * writes the snippet from them before every dev, test and build, and git never
 * holds a copy that could go stale.
 */
const PARTIAL = 'src/generated/me-client-cdn.mdx';
const page = readFileSync(join(process.cwd(), 'src/pages/integration/sign-in-button.mdx'), 'utf8');
const snippet = readFileSync(join(process.cwd(), PARTIAL), 'utf8');
const pkg = join(process.cwd(), 'node_modules/@orangecheck/me-client');
const installed = (
    JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8')) as { version: string }
).version;
const tags = [
    ...snippet.matchAll(
        /(?:href|src)="https:\/\/cdn\.jsdelivr\.net\/npm\/@orangecheck\/me-client@([^/]+)\/dist\/([^"]+)"\s+integrity="([^"]+)"\s+crossorigin="anonymous"/g
    ),
];

describe('the sign-in button page loads me-client by exact version and hash', () => {
    it('is written from the installed package before every build and test, never committed', () => {
        const { scripts } = JSON.parse(readFileSync('package.json', 'utf8')) as {
            scripts: Record<string, string>;
        };
        for (const step of ['predev', 'prebuild', 'pretest', 'pretest:run'])
            expect(scripts[step], step).toContain('node scripts/me-client-sri.mjs');
        expect(execFileSync('git', ['ls-files', PARTIAL], { encoding: 'utf8' })).toBe('');
        expect(execFileSync('git', ['check-ignore', PARTIAL], { encoding: 'utf8' }).trim()).toBe(
            PARTIAL
        );
    });

    it('shows the written snippet, and pins no me-client URL of its own', () => {
        expect(page).toContain("import MeClientCdn from '@/generated/me-client-cdn.mdx';");
        expect(page).toContain('<MeClientCdn />');
        expect(page).not.toMatch(/cdn\.jsdelivr\.net\/npm\/@orangecheck\/me-client/);
    });

    it('pins both files to the installed version, each with its hash and crossorigin', () => {
        expect(snippet.startsWith('```html\n')).toBe(true);
        expect(tags.map((t) => t[2]).sort()).toEqual(['button-auto.mjs', 'button.css']);
        for (const [, version] of tags) expect(version).toBe(installed);
        // No jsDelivr URL in the snippet goes unpinned or unchecked.
        expect(
            snippet.match(/https:\/\/cdn\.jsdelivr\.net\/npm\/@orangecheck\/me-client[^"\s)]*/g)
        ).toHaveLength(tags.length);
    });

    it("carries each file's hash as published", () => {
        for (const [, , file, integrity] of tags) {
            const hash = `sha384-${createHash('sha384')
                .update(readFileSync(join(pkg, 'dist', file!)))
                .digest('base64')}`;
            expect(integrity, file).toBe(hash);
        }
    });
});
