// scripts/land.sh against a scripted gh: a PR the queue has merged is reported
// merged even when one read shows it open and out of the queue, and a real drop
// still fails, with its reason. A PR it opens carries the branch's suppressions lines.
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

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

/** A scratch git checkout whose origin is on GitHub: the script reads its repository from origin. */
function checkout() {
    const dir = mkdtempSync(join(tmpdir(), 'land-origin-'));
    spawnSync('git', ['init', '-q', dir]);
    spawnSync('git', [
        '-C',
        dir,
        'remote',
        'add',
        'origin',
        'git@github.com:orangecheck/oc-docs.git',
    ]);
    return dir;
}

/** Runs the script on PR 7 with gh answering `reads` in turn (the last repeats) and `compare` for main...head. */
function land(reads: string[], compare = 'diverged', timeout = '30') {
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
    const r = spawnSync('bash', [resolve('scripts/land.sh')], {
        cwd: checkout(),
        env: { ...process.env, LAND_GH: fake, LAND_PR: '7', LAND_POLL: '0', LAND_TIMEOUT: timeout },
        encoding: 'utf8',
    });
    return { code: r.status, out: r.stdout + r.stderr };
}

/**
 * Runs the script on branch topic with no PR open yet. origin's push URL is a local
 * bare repository, so origin still reads as GitHub, and ssh is refused outright, so
 * nothing can reach the real one. gh answers the compare for main...topic with
 * `messages` (or fails when it is null) and records the arguments `gh pr create` gets.
 */
function open(messages: string[] | null) {
    const dir = mkdtempSync(join(tmpdir(), 'land-open-'));
    const bare = join(dir, 'bare.git');
    spawnSync('git', ['init', '-q', '--bare', bare]);
    const work = checkout();
    const git = (...a: string[]) => spawnSync('git', ['-C', work, ...a], { encoding: 'utf8' });
    git('config', 'remote.origin.pushurl', bare);
    git('checkout', '-q', '-b', 'topic');
    git(
        '-c',
        'user.name=land-test',
        '-c',
        'user.email=land-test@example.invalid',
        'commit',
        '-q',
        '--allow-empty',
        '-m',
        'Topic'
    );
    if (messages) writeFileSync(join(dir, 'messages'), messages.join('\n') + '\n');
    const fake = join(dir, 'gh');
    writeFileSync(
        fake,
        `#!/usr/bin/env bash
case "$*" in
  *graphql*) printf '%s\\n' "${read('MERGED', false, false, '-', 'm'.repeat(40))}" ;;
  *commit.message*) [ -f "${dir}/messages" ] && cat "${dir}/messages" ;;
  "pr view"*--jq*) echo 7 ;;
  "pr view"*) exit 1 ;;
  "pr create"*) printf '%s\\0' "$@" > "${dir}/created" ;;
  "pr merge"*) ;;
  *) exit 1 ;;
esac
`
    );
    chmodSync(fake, 0o755);
    const r = spawnSync('bash', [resolve('scripts/land.sh'), 'topic'], {
        cwd: work,
        env: {
            ...process.env,
            LAND_GH: fake,
            LAND_POLL: '0',
            LAND_TIMEOUT: '30',
            GIT_SSH_COMMAND: 'false',
        },
        encoding: 'utf8',
    });
    const pushed =
        spawnSync('git', ['-C', bare, 'rev-parse', '-q', '--verify', 'topic']).status === 0;
    const created = join(dir, 'created');
    const args = existsSync(created) ? readFileSync(created, 'utf8').split('\0') : null;
    const body = args ? args[args.indexOf('--body') + 1] : null;
    return { code: r.status, out: r.stdout + r.stderr, body, pushed };
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
        expect(r.out).toContain('land: merged; main holds hhhh');
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

    it('fails a dropped PR that main has not caught up with (compare reads "ahead")', () => {
        const r = land([read('OPEN', true, true, 'QUEUED'), read('OPEN', false, false)], 'ahead');
        expect(r.out).toContain('land: the queue dropped PR #7');
        expect(r.code).toBe(1);
    });

    it('re-reads before it reports a timeout', () => {
        expect(land([read('OPEN', true, true, 'QUEUED')], 'diverged', '0').out).toContain(
            'land: timed out waiting for the queue to merge PR #7'
        );
        const merged = land(
            [read('OPEN', true, true, 'QUEUED'), read('MERGED', false, false, '-', 'm'.repeat(40))],
            'diverged',
            '0'
        );
        expect(merged.code).toBe(0);
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

    it("copies each suppressions line in the branch's commits into the PR it opens, once", () => {
        const r = open([
            'Move the feed',
            '',
            'suppressions-raise: src/a.tsx react-hooks/refs it moved here from b.tsx',
            'Unrelated text naming suppressions-raise: in passing',
            'First file',
            '',
            '  suppressions-init: first file, written by --suppress-rule',
            'suppressions-raise: src/a.tsx react-hooks/refs it moved here from b.tsx',
        ]);
        expect(r.code).toBe(0);
        expect(r.pushed).toBe(true);
        expect(r.body).toBe(
            [
                'Landed by scripts/land.sh through the merge queue.',
                '',
                'suppressions-raise: src/a.tsx react-hooks/refs it moved here from b.tsx',
                'suppressions-init: first file, written by --suppress-rule',
            ].join('\n')
        );
    });

    it('opens the PR with the plain body when the commits carry no line', () => {
        const r = open(['Fix a link', '', 'The guide moved.']);
        expect(r.code).toBe(0);
        expect(r.body).toBe('Landed by scripts/land.sh through the merge queue.');
    });

    it('opens no PR when it cannot read the range', () => {
        const r = open(null);
        expect(r.code).toBe(1);
        expect(r.out).toContain('for its suppressions lines; no PR opened');
        expect(r.body).toBeNull();
    });
});
