// scripts/gen-llms.mjs over the real pages: llms.txt names each page by its own
// metadata, and each .md copy keeps the page's words and code with no MDX left in it.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { beforeAll, describe, expect, it } from 'vitest';

import { generate } from '../../scripts/gen-llms.mjs';

const ROOT = join(__dirname, '..', '..');
const source = (route: string) => readFileSync(join(ROOT, 'src/pages', `${route}.mdx`), 'utf8');

/** A string field of the page's `export const metadata`, read straight from its source. */
function metaField(src: string, key: string): string {
    const m = new RegExp(`${key}:\\s*'((?:[^'\\\\]|\\\\.)*)'`).exec(src);
    if (!m) throw new Error(`no ${key} in the page's metadata`);
    return m[1]!.replace(/\\'/g, "'");
}

/** The page's fenced code blocks, as written. */
const fences = (md: string) => md.match(/^```[^\n]*\n[\s\S]*?^```$/gm) ?? [];

/** Lines outside fenced code. */
const prose = (md: string) => md.replace(/^```[^\n]*\n[\s\S]*?^```$/gm, '').split('\n');

let out: ReturnType<typeof generate>;
beforeAll(() => {
    out = generate(ROOT);
}, 60_000);

describe('llms.txt', () => {
    it('lists /me/quickstart by its own title and description, linked to its copy', () => {
        const src = source('me/quickstart');
        const line = `- [${metaField(src, 'title')}](https://ochk.io/docs/me/quickstart.md): ${metaField(src, 'description')}`;
        expect(out.files.get('llms.txt')!.split('\n')).toContain(line);
    });

    it('links only copies it writes', () => {
        const llms = out.files.get('llms.txt')!;
        const links = [...llms.matchAll(/\]\(https:\/\/ochk\.io\/docs\/([^)]+\.md)\)/g)].map(
            (m) => m[1]
        );
        expect(links.length).toBeGreaterThan(100);
        expect(links.filter((p) => !out.files.has(p!))).toEqual([]);
    });

    it('writes out every component a page uses, so none is left as a bare wrapper', () => {
        expect(out.unknown).toEqual([]);
    });
});

describe('a page as markdown', () => {
    it('keeps the page text and every code block, and drops its import and export lines', () => {
        const src = source('me/quickstart');
        const md = out.files.get('me/quickstart.md')!;
        const lines = src.split('\n');
        const firstParagraph = lines[lines.findIndex((l) => l.startsWith('# ')) + 2]!;
        expect(firstParagraph.length).toBeGreaterThan(40);
        expect(md).toContain(firstParagraph);
        // The samples keep their own imports: only the page's MDX statements go.
        expect(fences(src).length).toBeGreaterThan(5);
        for (const block of fences(src)) expect(md).toContain(block);
        expect(prose(md).filter((l) => /^(import|export) /.test(l))).toEqual([]);
        expect(md.startsWith('# ')).toBe(true);
    });

    it('makes every link absolute under ochk.io/docs', () => {
        const md = out.files.get('me/quickstart.md')!;
        expect(md).toContain('](https://ochk.io/docs/me/sdk#when-someone-ends-every-session)');
        expect(prose(md).join('\n')).not.toMatch(/\]\(\/|\]\(#/);
    });

    it('writes an included file and a component out as what they show', () => {
        const src = source('integration/sign-in-button');
        expect(src).toMatch(/^import MeClientCdn from /m);
        const md = out.files.get('integration/sign-in-button.md')!;
        const cdn = readFileSync(join(ROOT, 'src/generated/me-client-cdn.mdx'), 'utf8').trim();
        expect(md).toContain(cdn);
        expect(md).not.toMatch(/<(MeClientCdn|SignInButtonHosts|SignInButtonBrand|MarkVariants)\b/);
        expect(prose(md).filter((l) => /^(import|export) /.test(l))).toEqual([]);

        const home = out.files.get('index.md')!;
        expect(home).not.toContain('<ProtocolGrid');
        expect(home).toContain('- [pledge](https://ochk.io/docs/pledge) (commitment): ');
    });

    it('reads an SDK reference page without TypeDoc breadcrumbs or escapes', () => {
        const md = out.files.get('sdk/me-client/popup/functions/signInWithOc.md')!;
        expect(md.startsWith('# Function: signInWithOc()')).toBe(true);
        expect(md).toContain(
            '`Promise`<[`OcPopupResult`](https://ochk.io/docs/sdk/me-client/popup/interfaces/OcPopupResult)'
        );
        expect(md).not.toContain('&lt;');
    });
});

describe('llms-full.txt', () => {
    it('holds each written page under its URL, and leaves the SDK reference out', () => {
        const full = out.files.get('llms-full.txt')!;
        expect(full).toContain(
            `URL: https://ochk.io/docs/me/quickstart\n\n${out.files.get('me/quickstart.md')}`
        );
        expect(full).toContain('URL: https://ochk.io/docs/sdk/python\n');
        expect(full).not.toContain('URL: https://ochk.io/docs/sdk/me-client/');
    });
});
