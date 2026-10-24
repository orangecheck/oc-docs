import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * The sign-in button page tells readers to load me-client from jsDelivr with
 * an exact version and Subresource Integrity hashes. They must describe the
 * files npm publishes: the installed package came from npm, checked against
 * the lockfile, so its files are the reference.
 */
const page = readFileSync(join(process.cwd(), 'src/pages/integration/sign-in-button.mdx'), 'utf8');
const pkg = join(process.cwd(), 'node_modules/@orangecheck/me-client');
const installed = (
    JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8')) as { version: string }
).version;
const tags = [
    ...page.matchAll(
        /(?:href|src)="https:\/\/cdn\.jsdelivr\.net\/npm\/@orangecheck\/me-client@([^/]+)\/dist\/([^"]+)"\s+integrity="([^"]+)"\s+crossorigin="anonymous"/g
    ),
];

describe('the sign-in button page loads me-client by exact version and hash', () => {
    it('pins both files to the installed version, each with its hash and crossorigin', () => {
        expect(tags.map((t) => t[2]).sort()).toEqual(['button-auto.mjs', 'button.css']);
        for (const [, version] of tags) expect(version).toBe(installed);
        // No jsDelivr URL on the page goes unpinned or unchecked.
        expect(
            page.match(/https:\/\/cdn\.jsdelivr\.net\/npm\/@orangecheck\/me-client[^"\s)]*/g)
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
