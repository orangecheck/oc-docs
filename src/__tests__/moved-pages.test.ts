/**
 * Docs pages that are gone land where their content lives now
 * (src/lib/moved-pages.ts), and nothing live is redirected. Each address runs
 * through Next's own matcher over the real next.config, so a rule widened to a
 * wildcard catches a live page and turns this red.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import {
    getRedirectUrl,
    unstable_getResponseFromNextConfig,
} from 'next/experimental/testing/server';
import { describe, expect, it } from 'vitest';

import nextConfig from '../../next.config';
import { MOVED_PAGES } from '../lib/moved-pages';
import moved from './fixtures/moved-pages.json';

const HOST = 'https://ochk.io';
const ROOT = resolve(__dirname, '../..');
const PAGES = resolve(__dirname, '../pages');

const answer = (url: string) => unstable_getResponseFromNextConfig({ url, nextConfig });

function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const abs = join(dir, name);
        return statSync(abs).isDirectory() ? walk(abs) : [abs];
    });
}

/** Page files under src/pages as routes: index → its folder; no API routes, no dynamic segments. */
const routes = (files: string[]) =>
    files
        .filter((f) => /\.(mdx|md|tsx)$/.test(f) && !/^(_|api\/)/.test(f) && !f.includes('['))
        .map(
            (f) =>
                `/${f.replace(/\.(mdx|md|tsx)$/, '').replace(/(^|\/)index$/, '')}`.replace(
                    /\/$/,
                    ''
                ) || '/'
        );

const live = routes(walk(PAGES).map((f) => relative(PAGES, f)));

describe('moved docs pages', () => {
    it('are written out in the fixture, one for one', () => {
        expect(moved.routes.length).toBe(Object.keys(MOVED_PAGES).length);
        expect(moved.routes.length).toBeGreaterThanOrEqual(66);
    });

    it.each(moved.routes.map((r) => [r.path, r.location]))(
        '%s → %s, 308',
        async (path, location) => {
            const res = await answer(`${HOST}${path}`);
            expect(res.status).toBe(308);
            expect(getRedirectUrl(res)).toBe(location);
        }
    );

    it('never shadow a page that exists', () => {
        const shadowed = Object.keys(MOVED_PAGES).filter((p) => live.includes(p));
        expect(shadowed).toEqual([]);
    });

    it('leave every live page alone', async () => {
        expect(live.length).toBeGreaterThan(1000);
        const redirected: string[] = [];
        for (const route of live) {
            const res = await answer(`${HOST}/docs${route === '/' ? '' : route}`);
            // /sdk/<pkg> goes to its README on purpose (next.config); nothing else moves.
            if (getRedirectUrl(res) && !/^\/sdk\/[^/]+$/.test(route)) redirected.push(route);
        }
        expect(redirected).toEqual([]);
    });

    // A TypeDoc sync drops the page of a renamed or reshaped export. CI names the
    // commit main was at (DOCS_BASE_SHA); locally it is where this branch left origin/main.
    it('include every page the base commit had that is gone now', async () => {
        const git = (...args: string[]) =>
            execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' });
        const base = process.env.DOCS_BASE_SHA || git('merge-base', 'HEAD', 'origin/main').trim();
        const before = routes(
            git('ls-tree', '-r', '-z', '--name-only', base, '--', 'src/pages/')
                .split('\0')
                .filter(Boolean)
                .map((f) => f.slice('src/pages/'.length))
        );
        expect(before.length).toBeGreaterThan(1000);
        const stranded: string[] = [];
        for (const route of before.filter((r) => !live.includes(r))) {
            const location = getRedirectUrl(await answer(`${HOST}/docs${route}`));
            const lands = location && (new URL(location).pathname.replace(/^\/docs/, '') || '/');
            if (!lands || !live.includes(lands)) stranded.push(route);
        }
        expect(stranded, `gone since ${base}: add each to MOVED_PAGES and the fixture`).toEqual([]);
    });
});
