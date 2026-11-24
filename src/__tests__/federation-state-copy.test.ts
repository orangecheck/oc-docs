import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const ME = join(__dirname, '..', 'pages', 'me');
const pages = readdirSync(ME, { recursive: true, encoding: 'utf8' }).filter((f) =>
    f.endsWith('.mdx')
);

// Guardian federations run on the test stack, so "none is bound" is true of
// production only, and every page that says it names that.
describe('where the docs say no guardian federation is bound', () => {
    it('each one says in production', () => {
        const said = pages.flatMap((f) => {
            const text = readFileSync(join(ME, f), 'utf8')
                .replace(/^> ?/gm, '')
                .replace(/\s+/g, ' ');
            return [...text.matchAll(/no guardian federation is bound[^.]*\./gi)].map(
                (m) => `${f}: ${m[0]}`
            );
        });
        expect(said.length).toBeGreaterThanOrEqual(4);
        for (const s of said) expect(s).toMatch(/bound in production/);
    });
});
