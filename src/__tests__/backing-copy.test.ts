import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const src = (f: string) => readFileSync(join(__dirname, '..', f), 'utf8');

// "One coin" with no amount reads as one whole bitcoin. Where the docs speak
// to people, backing is bitcoin they already hold, in the amount an app asks.
describe('the docs never ask for "one coin" without its amount', () => {
    it('the bonds blurb, which is the page description', () => {
        const nav = src('components/docs/nav.ts');
        expect(nav).not.toMatch(/One coin backs one account/);
        expect(nav).toMatch(
            /bitcoin you already hold: one coin of at least the sats an app asks for/
        );
    });

    it('the ochk.app overview and the glossary', () => {
        expect(src('pages/me/index.mdx')).not.toMatch(
            /One coin backs an account|with a coin that stays/
        );
        // Coins are never added, so an amount always comes with its one-coin condition.
        const index = src('pages/me/index.mdx').replace(/\s+/g, ' ');
        expect(index).toMatch(
            /in one coin of at least the amount an app sets \(say, 100,000 sats held 30 days\)/
        );
        expect(index).not.toMatch(/as much as an app asks/);
        expect(src('pages/me/glossary.mdx')).toMatch(
            /one coin \(one unspent output\) of at least the sats an app asks for/
        );
    });
});
