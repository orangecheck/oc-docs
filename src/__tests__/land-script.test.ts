// scripts/land.sh against a scripted gh: a PR the queue has merged is reported
// merged even when one read shows it open and out of the queue, and a real drop
// still fails, with its reason.
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/** One read of the PR, as the script's jq turns it into a tab-separated line. */
const read = (
    state: string,
    inQueue: boolean,
    auto: boolean,
    entry = '-',
    merged = '-',
    head = 'h'.repeat(40)
) => [state, inQueue, auto, entry, 'SUCCESS', merged, head].join('\t');

/** Runs the script on PR 7 with gh answering `reads` in turn (the last repeats) and `compare` for main...head. */
function land(reads: string[], compare = 'diverged') {
    const dir = mkdtempSync(join(tmpdir(), 'land-'));
    writeFileSync(join(dir, 'reads'), reads.join('\n') + '\n');
    writeFileSync(join(dir, 'compare'), compare + '\n');
    const fake = join(dir, 'gh');
    writeFileSync(
        fake,
        `#!/usr/bin/env bash
case "$*" in
  *graphql*)
    n=$(cat "${dir}/n" 2>/dev/null || echo 0); n=$((n + 1)); echo "$n" > "${dir}/n"
    line=$(sed -n "\${n}p" "${dir}/reads"); [ -n "$line" ] || line=$(tail -n 1 "${dir}/reads")
    printf '%s\\n' "$line" ;;
  *compare*) cat "${dir}/compare" ;;
  *) exit 1 ;;
esac
`
    );
    chmodSync(fake, 0o755);
    const r = spawnSync('bash', ['scripts/land.sh'], {
        env: { ...process.env, LAND_GH: fake, LAND_PR: '7', LAND_POLL: '0', LAND_TIMEOUT: '30' },
        encoding: 'utf8',
    });
    return { code: r.status, out: r.stdout + r.stderr };
}

describe('scripts/land.sh', () => {
    it('reports merged when the PR reads open and out of the queue for a moment after it merged', () => {
        const r = land([
            read('OPEN', true, true, 'QUEUED'),
            read('OPEN', false, false),
            read('MERGED', false, false, '-', 'm'.repeat(40)),
        ]);
        expect(r.out).toContain(`land: merged; main is now ${'m'.repeat(40)} (PR #7)`);
        expect(r.code).toBe(0);
    });

    it('reports merged when main already holds the PR head, though the PR still reads open', () => {
        const r = land([read('OPEN', true, true, 'QUEUED'), read('OPEN', false, false)], 'behind');
        expect(r.out).toContain('land: merged; main is now hhhh');
        expect(r.out).toContain("the PR's head (PR #7)");
        expect(r.code).toBe(0);
    });

    it('fails a PR the queue really dropped, with the reason', () => {
        const r = land([read('OPEN', true, true, 'QUEUED'), read('OPEN', false, false)]);
        expect(r.out).toContain(
            'land: the queue dropped PR #7: its group run failed or main changed under it'
        );
        expect(r.code).toBe(1);
    });

    it('fails a PR the queue cannot merge, unless a fresh read shows it merged', () => {
        expect(land([read('OPEN', true, true, 'UNMERGEABLE')]).code).toBe(1);
        const merged = land([
            read('OPEN', true, true, 'UNMERGEABLE'),
            read('MERGED', false, false, '-', 'm'.repeat(40)),
        ]);
        expect(merged.code).toBe(0);
    });

    it('fails a closed PR and a failed check at once', () => {
        expect(land([read('CLOSED', false, false)]).out).toContain('land: PR #7 was closed');
        const failed = land([['OPEN', 'true', 'true', 'QUEUED', 'FAILURE', '-', 'h'].join('\t')]);
        expect(failed.out).toContain('a check failed on PR #7');
        expect(failed.code).toBe(1);
    });
});
