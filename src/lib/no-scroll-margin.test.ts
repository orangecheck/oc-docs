import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * app-design's scroll-padding keeps what a link lands on clear of the docs' sticky bars, at every
 * width since 2.10.0. A scroll-margin adds to that, 112px for a scroll-mt-28, so nothing here
 * carries one, in any form.
 */

const SRC = join(__dirname, '..');
const MARGIN = /\bscroll-m[trblxyse]?-[^\s"'`]+|\bscroll-margin[\w-]*\s*:|\bscrollMargin\w*/g;

function files(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) return files(path);
        return /\.(tsx?|mjs|css)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
    });
}

describe("the docs' anchors", () => {
    it('land where the bars leave them, with no scroll-margin of their own', () => {
        const all = files(SRC);
        // The scan reads real files: an empty list would pass for nothing.
        expect(all.length).toBeGreaterThan(20);
        const found = all.flatMap((path) =>
            (readFileSync(path, 'utf8').match(MARGIN) ?? []).map(
                (m) => `${relative(SRC, path)}: ${m}`
            )
        );
        expect(found).toEqual([]);
    });

    it('catch every form of a scroll-margin', () => {
        const forms = [
            'scroll-mt-28',
            'scroll-my-4',
            'scroll-m-2',
            'lg:scroll-mt-[75px]',
            'scroll-margin-top: 1rem',
            'scroll-margin-block-start: 1rem',
            'el.style.scrollMarginTop',
            'el.style.scrollMargin',
        ];
        expect(forms.map((f) => (f.match(MARGIN) ?? []).length)).toEqual(forms.map(() => 1));
    });
});
