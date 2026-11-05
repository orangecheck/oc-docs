// scripts/npm-latest.mjs against a scripted registry and clock, so no request leaves the
// box. It replays 2026-11-03: lock-core 1.5.0 was listed as latest at 21:16:25, and its
// tarball still answered 404 when a docs check read it two minutes later. The wait
// returns only once the tarball is served, gives up after 15 minutes, and never waits
// for a version published more than an hour ago.
import { describe, expect, it } from 'vitest';

import { latestServed } from '../../scripts/npm-latest.mjs';

const TARBALL = 'https://registry.npmjs.org/@orangecheck/lock-core/-/lock-core-1.5.0.tgz';

function registry({
    published = '2026-11-03T21:16:25.536Z',
    servedFrom = Infinity,
    status = 200,
    deprecated,
}: {
    published?: string | null;
    servedFrom?: number;
    status?: number;
    deprecated?: string;
} = {}) {
    const start = Date.parse('2026-11-03T21:18:20Z');
    let t = start;
    const heads: number[] = [];
    const reads: string[] = [];
    const logs: string[] = [];
    const doc = {
        'dist-tags': { latest: '1.5.0' },
        time: { '1.5.0': published },
        versions: { '1.5.0': { deprecated, dist: { tarball: TARBALL } } },
    };
    const deps = {
        fetch: async (url: string, init?: { method?: string }) => {
            if (init?.method === 'HEAD') {
                expect(url).toBe(TARBALL);
                heads.push(t);
                return new Response(null, { status: t >= servedFrom ? 200 : 404 });
            }
            reads.push(url);
            if (status !== 200) return new Response(null, { status });
            return new Response(JSON.stringify(doc), { status: 200 });
        },
        now: () => t,
        // The clock only moves here, so a wait with no end would never yield to a test timeout.
        sleep: async (ms: number) => {
            t += ms;
            if (t - start > 60 * 60_000) throw new Error('still waiting an hour later');
        },
        log: (line: string) => logs.push(line),
    };
    return { deps, heads, reads, logs, clock: () => t };
}

describe('latestServed', () => {
    it('waits for a fresh version until npm serves its tarball', async () => {
        const served = Date.parse('2026-11-03T21:22:00Z');
        const r = registry({ servedFrom: served });
        await expect(latestServed('@orangecheck/lock-core', r.deps)).resolves.toEqual({
            latest: '1.5.0',
            deprecated: undefined,
        });
        expect(r.reads).toEqual(['https://registry.npmjs.org/@orangecheck%2flock-core']);
        // 404 at 21:18:20, :30, :50, 21:19:30, 21:20:50, then served at 21:22:50.
        expect(r.heads.map((h) => new Date(h).toISOString().slice(11, 19))).toEqual([
            '21:18:20',
            '21:18:30',
            '21:18:50',
            '21:19:30',
            '21:20:50',
            '21:22:50',
        ]);
        expect(r.clock()).toBeGreaterThanOrEqual(served);
        expect(r.logs[0]).toBe(
            '@orangecheck/lock-core@1.5.0 was published at 2026-11-03T21:16:25.536Z; npm answers 404 for its tarball, waiting 10 s'
        );
    });

    it('gives up after 15 minutes on a tarball npm never serves, naming it', async () => {
        const r = registry();
        const start = r.clock();
        await expect(latestServed('@orangecheck/lock-core', r.deps)).rejects.toThrow(
            `@orangecheck/lock-core@1.5.0 was published at 2026-11-03T21:16:25.536Z and npm still answers 404 for ${TARBALL}; run this check again once npm serves it`
        );
        expect(r.clock() - start).toBeGreaterThanOrEqual(15 * 60_000);
        expect(r.clock() - start).toBeLessThanOrEqual(15 * 60_000 + 120_000);
    });

    it('does not wait for a version published more than an hour ago', async () => {
        const r = registry({ published: '2026-11-03T20:18:19Z', deprecated: 'use lock-client' });
        await expect(latestServed('@orangecheck/lock-core', r.deps)).resolves.toEqual({
            latest: '1.5.0',
            deprecated: 'use lock-client',
        });
        expect(r.heads).toEqual([]);
    });

    it('does not wait for a version npm gives no publish time for', async () => {
        const r = registry({ published: null });
        await latestServed('@orangecheck/lock-core', r.deps);
        expect(r.heads).toEqual([]);
    });

    it('answers null for a package npm does not have, and throws on any other refusal', async () => {
        const missing = registry({ status: 404 });
        await expect(
            latestServed('@orangecheck/no-such-package', missing.deps)
        ).resolves.toBeNull();
        expect(missing.heads).toEqual([]);

        const down = registry({ status: 503 });
        await expect(latestServed('@orangecheck/lock-core', down.deps)).rejects.toThrow(
            'registry 503 for @orangecheck/lock-core'
        );
    });
});
