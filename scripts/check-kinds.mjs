/**
 * Fail on prose that names an artifact beside the wrong Nostr kind.
 *
 * Why: five pages sent readers to kind 30084 for OC Stamp. 30084 is OC Agent
 * actions, so a reader querying it found nothing. The registry page
 * (/ecosystem/nostr-kind-30078) had the right number the whole time.
 *
 * The rule is narrow on purpose, so it cannot cry wolf: a prose line (not a
 * table row, not a code fence) that mentions exactly one family kind and
 * exactly one artifact below must use that artifact's kind. Lines naming
 * several kinds or several artifacts are comparisons and are skipped. The
 * table is checked against the registry page, so the two cannot drift apart.
 *
 * Usage: node scripts/check-kinds.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PAGES = 'src/pages';
const REGISTRY = 'src/pages/ecosystem/nostr-kind-30078.mdx';

// artifact -> [kind, pattern]. Order matters only for readability.
const ARTIFACTS = {
    stamp: [30083, /\bstamps?\b|oc-stamp:/i],
    'agent action': [30084, /\bagent[- ]actions?\b|oc-agent-act:/i],
    'agent revocation': [30085, /\brevocations?\b|oc-agent-rev:/i],
    'agent sub-delegation': [30086, /\bsub-?delegations?\b|oc-agent-sub:/i],
    // Bare "poll" is too common ("per voter per poll") to name the artifact.
    'vote poll': [30080, /\bpoll (?:events?|envelopes?)\b|oc-vote:poll:/i],
    'vote ballot': [30081, /\bballots?\b|oc-vote:ballot:/i],
    'vote reveal': [30082, /\breveals?\b|oc-vote:reveal:/i],
};
const KIND_RE = /\b30(?:0[7-9]\d|1[01]\d)\b/g;
// Inside a protocol's own section, a bare "envelope" is that protocol's.
const SECTION_ENVELOPE = { 'src/pages/stamp/': 'stamp' };
// Link targets carry kinds as page slugs (/ecosystem/nostr-kind-30078).
const LINK_TARGET = /\]\([^)]*\)|https?:\/\/\S+/g;

const failures = [];

// The table must agree with the published registry.
const registry = readFileSync(REGISTRY, 'utf8');
for (const [name, [kind]] of Object.entries(ARTIFACTS)) {
    const row = registry.split('\n').find((l) => l.startsWith('|') && l.includes(`\`${kind}\``));
    if (!row) failures.push(`${REGISTRY}: no registry row for ${kind} (${name})`);
}

function walk(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) out.push(...walk(p));
        else if (name.endsWith('.mdx')) out.push(p);
    }
    return out;
}

let checked = 0;
for (const file of walk(PAGES)) {
    let inFence = false;
    readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
            if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
            if (inFence || line.trimStart().startsWith('|')) return;
            const text = line.replace(LINK_TARGET, ']');
            const kinds = new Set([...text.matchAll(KIND_RE)].map((m) => Number(m[0])));
            if (kinds.size !== 1) return;
            let named = Object.entries(ARTIFACTS).filter(([, [, re]]) => re.test(text));
            if (named.length === 0 && /\benvelopes?\b/i.test(text)) {
                const section = Object.keys(SECTION_ENVELOPE).find((d) => file.startsWith(d));
                if (section)
                    named = [[SECTION_ENVELOPE[section], ARTIFACTS[SECTION_ENVELOPE[section]]]];
            }
            if (named.length !== 1) return;
            const [kind] = kinds;
            const [name, [want]] = named[0];
            checked++;
            if (kind !== want) {
                failures.push(`${file}:${i + 1}  ${name} is kind ${want}, line says ${kind}`);
            }
        });
}

console.log(`kind mentions: ${checked} checked · ${failures.length} wrong`);
for (const f of failures) console.log(`  ${f}`);
if (failures.length > 0) process.exitCode = 1;
