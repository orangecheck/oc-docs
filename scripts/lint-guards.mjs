#!/usr/bin/env node
// Two checks ESLint can't make on itself, run first in the lint step (oc-claude lint-gate.md, react-hooks ratchet).
// 1. Directives: no comment may name a local/ rule, disable everything, or set a plugin rule inline.
// 2. Suppressions: eslint-suppressions.json may only go down against the base of what is being pushed.
// Copied identically into every repo; the canonical copy and its tests live in oc-claude workspace/scripts.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

export const FILE = 'eslint-suppressions.json';
export const NEVER = 'local/no-react-hooks-disable-wide';
const SELF = ['scripts/lint-guards.mjs', 'scripts/eslint-local-rules.mjs'];
const ZERO = /^0+$/;

/**
 * Every place a comment could start, whatever comes before it, and the comment it would be:
 * [{ raw, at }]. Starts overlap, so a "//" inside a string can't hide a real comment after it.
 * A string that looks like a directive is reported too, which fails safe.
 */
export function comments(src) {
    const out = [];
    const re = /\/[/*]/g;
    let m;
    while ((m = re.exec(src))) {
        const at = m.index;
        const line = src[at + 1] === '/';
        const close = line ? src.indexOf('\n', at) : src.indexOf('*/', at + 2);
        const end = close < 0 ? src.length : line ? close : close + 2;
        out.push({ raw: src.slice(at, end), at });
        re.lastIndex = at + 1;
    }
    return out;
}

/** What is wrong with one comment, or null. */
export function directiveProblem(raw) {
    const body = raw.startsWith('//') ? raw.slice(2) : raw.slice(2, -2);
    const text = body.trim();
    const d =
        /^(eslint-disable-next-line|eslint-disable-line|eslint-disable|eslint-enable)(?=\s|$)([\s\S]*)$/.exec(
            text
        );
    if (d) {
        const rules = d[2]
            .split(/\s--\s|^--\s?/)[0]
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        if (rules.some((r) => r.startsWith('local/'))) return `a ${d[1]} naming a local/ rule`;
        if (rules.length === 0 && (d[1] === 'eslint-disable' || d[1] === 'eslint-disable-line'))
            return `a bare ${d[1]}, which silences every rule`;
        return null;
    }
    const c = /^eslint\s+([\s\S]+)$/.exec(text);
    if (c && raw.startsWith('/*') && /[@\w-]+\/[\w-]+\s*:/.test(c[1]))
        return 'an inline config that sets a plugin rule';
    return null;
}

/** Every directive problem in the given files: [{ file, line, problem }]. */
export function directiveProblems(files, read = (f) => readFileSync(f, 'utf8')) {
    const out = [];
    for (const file of files) {
        if (SELF.includes(file)) continue;
        const src = read(file);
        for (const { raw, at } of comments(src)) {
            const problem = directiveProblem(raw);
            if (problem) out.push({ file, line: src.slice(0, at).split('\n').length, problem });
        }
    }
    return out;
}

/** The raise and init lines in a set of texts (commit messages, a PR body). */
export function marks(texts) {
    const raise = new Set();
    let init = null;
    for (const t of texts)
        for (const line of String(t ?? '').split('\n')) {
            const r = /^suppressions-raise:\s+(\S+)\s+(\S+)\s+\S/.exec(line.trim());
            if (r) raise.add(`${r[1]} ${r[2]}`);
            const i = /^suppressions-init:\s+\S/.exec(line.trim());
            if (i) init = line.trim();
        }
    return { raise, init };
}

/** Parse a suppressions file's text; throws on anything but { path: { rule: { count } } }. */
export function parseSuppressions(text) {
    const j = JSON.parse(text);
    if (!j || typeof j !== 'object' || Array.isArray(j)) throw new Error('not an object');
    for (const [p, rules] of Object.entries(j)) {
        if (!rules || typeof rules !== 'object') throw new Error(`${p}: not an object`);
        for (const [r, v] of Object.entries(rules))
            if (!Number.isInteger(v?.count) || v.count < 0) throw new Error(`${p} ${r}: no count`);
    }
    return j;
}

/** Entries of `now` above `base`, as "path rule" with both counts. base null = the file did not exist there. */
export function raises(now, base) {
    const out = [];
    for (const [p, rules] of Object.entries(now))
        for (const [r, v] of Object.entries(rules)) {
            const was = base?.[p]?.[r]?.count ?? 0;
            if (v.count > was) out.push({ key: `${p} ${r}`, was, now: v.count });
        }
    return out;
}

/** Judge the current file against each base. hard: always fails. lines: fails in CI, a reminder locally. */
export function judge({ now, bases, texts, prBody, event }) {
    const hard = [];
    const fails = [];
    for (const [p, rules] of Object.entries(now))
        if (rules[NEVER]) hard.push(`${p}: ${NEVER} is never suppressed; fix the comment instead.`);
    // On a pull request the lines must be in its body: a squash can drop commit details.
    const m = marks(event === 'pull_request' ? [prBody] : [...texts, prBody]);
    for (const b of bases) {
        if (b.missing) {
            if (Object.keys(now).length && !m.init)
                fails.push(
                    `${FILE} is new against ${b.sha}: a commit${event === 'pull_request' ? ' and the PR body' : ''} must carry one reviewed "suppressions-init: <reason>" line.`
                );
            continue;
        }
        for (const r of raises(now, b.file))
            if (!m.raise.has(r.key))
                fails.push(
                    `${r.key}: ${r.was} → ${r.now} against ${b.sha}, with no "suppressions-raise: ${r.key} <reason>" line.`
                );
    }
    return { hard, lines: fails };
}

const api = async (path, token, fetchImpl = fetch) => {
    const res = await fetchImpl(`https://api.github.com${path}`, {
        headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error(`the compare API answered ${res.status} for ${path}`);
    return res.json();
};

/** The bases to compare against and the range's commit messages, per event (lint-gate.md). Throws to fail closed. */
export async function resolveRange(env, fetchImpl = fetch) {
    const repo = env.GITHUB_REPOSITORY;
    const token = env.GITHUB_TOKEN;
    const ev = env.OC_EVENT;
    let from, to;
    if (ev === 'pull_request') [from, to] = [env.OC_PR_BASE, env.OC_PR_HEAD];
    else if (ev === 'merge_group') [from, to] = [env.OC_MG_BASE, env.OC_MG_HEAD];
    else if (ev === 'push' && env.OC_BEFORE && !ZERO.test(env.OC_BEFORE))
        [from, to] = [env.OC_BEFORE, env.OC_AFTER];
    else [from, to] = [env.OC_DEFAULT_BRANCH, env.OC_AFTER || env.GITHUB_SHA];
    if (!repo || !token || !from || !to)
        throw new Error('the event did not give a range to compare');
    const c = await api(`/repos/${repo}/compare/${from}...${to}`, token, fetchImpl);
    const base = c?.merge_base_commit?.sha;
    if (!base) throw new Error(`the compare API gave no merge base for ${from}...${to}`);
    if ((c.total_commits ?? 0) > 250)
        throw new Error(
            `the range has ${c.total_commits} commits, past the compare API's 250; push it in parts`
        );
    const bases = [base];
    // A force push to main replaced its tip: what was live must not be raised over either.
    const onMain = env.GITHUB_REF === `refs/heads/${env.OC_DEFAULT_BRANCH}`;
    if (
        ev === 'push' &&
        onMain &&
        (c.status === 'behind' || c.status === 'diverged') &&
        from !== base
    )
        bases.push(from);
    return { bases, texts: (c.commits ?? []).map((x) => x?.commit?.message ?? '') };
}

const git = (...a) =>
    execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

/** The suppressions file at a commit: { file } , { missing }, or a throw when it exists and won't parse. */
export function fileAt(sha, show = (s) => git('show', `${s}:${FILE}`)) {
    let text;
    try {
        text = show(sha);
    } catch (e) {
        if (/does not exist|exists on disk, but not in/.test(String(e?.stderr ?? e?.message)))
            return { sha, missing: true };
        throw new Error(
            `could not read ${FILE} at ${sha}: ${String(e?.stderr ?? e?.message).trim()}`
        );
    }
    try {
        return { sha, file: parseSuppressions(text) };
    } catch (e) {
        throw new Error(
            `${FILE} at ${sha} does not parse (${e.message}); it is never read as missing`
        );
    }
}

async function main() {
    const fails = [];
    const tracked = git(
        'ls-files',
        '*.js',
        '*.jsx',
        '*.mjs',
        '*.cjs',
        '*.ts',
        '*.tsx',
        '*.mts',
        '*.cts'
    )
        .split('\n')
        .filter((f) => f && !f.startsWith('node_modules/'));
    for (const p of directiveProblems(tracked)) fails.push(`${p.file}:${p.line}: ${p.problem}.`);

    let now = {};
    if (existsSync(FILE)) {
        try {
            now = parseSuppressions(readFileSync(FILE, 'utf8'));
        } catch (e) {
            fails.push(`${FILE} does not parse: ${e.message}.`);
        }
    }
    try {
        let bases, texts;
        if (process.env.GITHUB_ACTIONS === 'true') {
            ({ bases, texts } = await resolveRange(process.env));
            for (const b of bases) git('fetch', '--no-tags', '--depth=1', 'origin', b);
        } else {
            const base = git('merge-base', 'HEAD', 'origin/main').trim();
            bases = [base];
            texts = git('log', '--format=%B%x00', `${base}..HEAD`).split('\0');
        }
        const j = judge({
            now,
            bases: bases.map((s) => fileAt(s)),
            texts,
            prBody: process.env.OC_PR_BODY ?? '',
            event: process.env.OC_EVENT ?? 'local',
        });
        fails.push(...j.hard);
        // Locally the commit that will carry the line may not exist yet: CI is where it is enforced.
        if (process.env.GITHUB_ACTIONS === 'true') fails.push(...j.lines);
        else for (const l of j.lines) console.log(`lint-guards: CI will require: ${l}`);
    } catch (e) {
        fails.push(`suppressions check failed closed: ${e.message}.`);
    }
    if (fails.length) {
        console.error(
            `lint-guards: ${fails.length} problem${fails.length === 1 ? '' : 's'}:\n${fails.map((f) => `  ${f}`).join('\n')}`
        );
        process.exit(1);
    }
    console.log(
        process.env.GITHUB_ACTIONS === 'true'
            ? 'lint-guards: directives clean; suppressions at or below the base.'
            : 'lint-guards: directives clean; CI checks the suppressions against the pushed range.'
    );
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
