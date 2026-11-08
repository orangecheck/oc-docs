import { join } from 'node:path';

import { scrollMargins } from '@orangecheck/app-design/vitest';
import { describe, expect, it } from 'vitest';

/**
 * app-design's scroll-padding keeps what a link lands on clear of the docs' sticky bars, at every
 * width since 2.10.0. A scroll-margin adds to that, 112px for the one a heading carried, so nothing
 * here carries one, in any form: not the code, and not the pages, hand-written or synced from
 * TypeDoc. The rule and what it reads, the MDX pages among them, are app-design's scrollMargins.
 */

const page = scrollMargins(join(__dirname, '..'));

describe("the docs' anchors", () => {
    it('are read from every source, the stylesheets among them', () => {
        expect(page.files).toBeGreaterThan(1500);
        expect(page.stylesheets).toBeGreaterThan(0);
    });

    it('land where the bars leave them, with no scroll-margin of their own', () => {
        expect(page.margins).toEqual([]);
    });
});
