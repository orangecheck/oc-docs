/**
 * Docs sitemap — source of truth for the sidebar, breadcrumbs, and prev/next.
 *
 * Organized for the ecosystem-first framing: shared concepts up top
 * (Getting Started / Ecosystem), then one section per sibling protocol
 * (Attest / Lock / Stamp / Vote / Agent), then SDKs and Reference. Every
 * entry in every section is a real .mdx file under src/pages/.
 *
 * When you edit this file, keep the following invariants:
 *   1. Every `href` MUST correspond to an existing `.mdx` file.
 *   2. Section slugs are the URL root for that section (e.g. `attest`
 *      maps to everything under `/attest/*`).
 *   3. Protocol sections should always lead with an overview page,
 *      followed by concepts, then API, then guides.
 */

export interface DocsItem {
    href: string;
    label: string;
    blurb?: string;
    badge?: string;
}

export interface DocsSection {
    slug: string;
    label: string;
    blurb?: string;
    items: DocsItem[];
}

export const DOCS_NAV: DocsSection[] = [
    {
        slug: 'getting-started',
        label: 'Getting started',
        blurb: 'Land here. Pick a protocol. Ship.',
        items: [
            {
                href: '/',
                label: 'Overview',
                blurb: 'What the OrangeCheck ecosystem is and where to go.',
            },
            {
                href: '/getting-started/which-protocol',
                label: 'Which protocol do I need?',
                blurb: 'A decision tree across Attest / Lock / Stamp / Vote / Agent.',
            },
            {
                href: '/getting-started/quickstart',
                label: 'Quickstart',
                blurb: 'A running integration in under five minutes.',
            },
        ],
    },
    {
        slug: 'ecosystem',
        label: 'Ecosystem (shared)',
        blurb: 'The plumbing every protocol inherits.',
        items: [
            {
                href: '/ecosystem',
                label: 'Overview',
                blurb: 'Why these concepts are here and not per-protocol.',
            },
            {
                href: '/ecosystem/canonical-message',
                label: 'The canonical message',
                blurb: 'Header + fields + signing rules. One format, every protocol.',
            },
            {
                href: '/ecosystem/bip322',
                label: 'BIP-322 signing',
                blurb: 'The signature primitive. Why not legacy signmessage.',
            },
            {
                href: '/ecosystem/nostr-kind-30078',
                label: 'Nostr publication',
                blurb: 'Kind registry (30078, 30080–30085) + d-tag conventions for all six protocols.',
            },
            {
                href: '/ecosystem/conformance',
                label: 'Conformance vectors',
                blurb: 'Cross-impl test suites that prove byte-identical output.',
            },
            {
                href: '/ecosystem/security',
                label: 'Security model',
                blurb: 'Shared threat model. What Bitcoin stake proofs do NOT protect against.',
            },
        ],
    },
    {
        slug: 'attest',
        label: 'OC Attest',
        blurb: 'Sybil resistance via proof of Bitcoin stake. The base layer.',
        items: [
            {
                href: '/attest',
                label: 'Overview',
                blurb: 'What Attest is and who it is for.',
            },
            {
                href: '/attest/how-it-works',
                label: 'How it works',
                blurb: 'Sign → publish → verify. The whole protocol on one page.',
            },
            {
                href: '/attest/scoring',
                label: 'Scoring',
                blurb: 'sats_bonded, days_unspent, score_v0. Advisory only.',
            },
            {
                href: '/attest/verification',
                label: 'Verification',
                blurb: 'Exact checks a verifier performs.',
            },
            {
                href: '/attest/api',
                label: 'HTTP API',
                blurb: '/api/check, /api/verify, /api/challenge, /api/discover.',
            },
            {
                href: '/attest/guides/express',
                label: 'Guide: gate an Express route',
                blurb: 'Drop-in middleware in 10 lines.',
            },
            {
                href: '/attest/guides/airdrop',
                label: 'Guide: filter an airdrop',
                blurb: 'Turn a candidate list into a sybil-resistant allowlist.',
            },
            {
                href: '/attest/guides/sign-in-with-bitcoin',
                label: 'Guide: sign in with Bitcoin',
                blurb: 'Signed-challenge session auth end to end.',
            },
            {
                href: '/attest/guides/nostr-relay',
                label: 'Guide: sybil-filter a Nostr relay',
                blurb: 'Drop a Strfry plugin into your relay; reject events from unproofed npubs.',
            },
            {
                href: '/attest/guides/self-hosting',
                label: 'Guide: self-host the verifier',
                blurb: 'Run the whole stack on your own Postgres + Vercel / Docker / VM.',
            },
        ],
    },
    {
        slug: 'lock',
        label: 'OC Lock',
        blurb: 'End-to-end encryption addressed to a Bitcoin address.',
        items: [
            { href: '/lock', label: 'Overview', blurb: 'What Lock is and who it is for.' },
            {
                href: '/lock/why',
                label: 'Why OC Lock',
                blurb: 'The v1 postmortem — what went wrong and what v2 fixes.',
            },
            {
                href: '/lock/quickstart',
                label: 'Quickstart',
                blurb: 'Seal your first vault in five minutes.',
            },
            {
                href: '/lock/how-it-works',
                label: 'How it works',
                blurb: 'Device keys → directory → seal → unseal.',
            },
            {
                href: '/lock/protocol',
                label: 'Protocol walkthrough',
                blurb: 'Narrative tour of the flows and why they compose.',
            },
            {
                href: '/lock/envelope-format',
                label: 'Envelope format',
                blurb: 'Canonical JSON, field-by-field, byte-identical across clients.',
            },
            {
                href: '/lock/envelope',
                label: 'Envelope reference',
                blurb: 'Per-field semantics, error cases, validation rules.',
            },
            {
                href: '/lock/device-keys',
                label: 'Device keys',
                blurb: 'BIP-322-bound X25519 keys and the kind-30078 directory record.',
            },
            {
                href: '/lock/chat',
                label: 'Chat transport',
                blurb: 'How sealed envelopes move across Nostr relays and out-of-band channels.',
            },
            {
                href: '/lock/security',
                label: 'Security posture',
                blurb: 'What breaks, what leaks, and what an attacker must pay.',
            },
            {
                href: '/lock/spec',
                label: 'Specification',
                blurb: 'Normative rules, canonicalization, error codes.',
            },
        ],
    },
    {
        slug: 'stamp',
        label: 'OC Stamp',
        blurb: 'Bitcoin-block-anchored signed statements.',
        items: [
            { href: '/stamp', label: 'Overview', blurb: 'What Stamp is and who it is for.' },
            {
                href: '/stamp/why',
                label: 'Why OC Stamp',
                blurb: 'PGP + OTS + C2PA in one self-contained envelope.',
            },
            {
                href: '/stamp/quickstart',
                label: 'Quickstart',
                blurb: 'Produce and verify your first stamp in five minutes.',
            },
            {
                href: '/stamp/how-it-works',
                label: 'How it works',
                blurb: 'Sign + anchor to a Bitcoin block via OpenTimestamps.',
            },
            {
                href: '/stamp/protocol',
                label: 'Protocol walkthrough',
                blurb: 'The three envelopes and how they compose with Attest and Lock.',
            },
            {
                href: '/stamp/envelope',
                label: 'Envelope format',
                blurb: 'Canonical JSON for signed statements and OTS proofs.',
            },
            {
                href: '/stamp/ots',
                label: 'OpenTimestamps',
                blurb: 'OTS proofs, upgrade paths, and verification pipeline.',
            },
            {
                href: '/stamp/ots-anchor',
                label: 'OTS anchor',
                blurb: 'How stamp-ots bridges OpenTimestamps proofs into the envelope.',
            },
            {
                href: '/stamp/nostr',
                label: 'Nostr publication',
                blurb: 'Publishing stamps on NIP-78 addressable events.',
            },
            {
                href: '/stamp/use-cases',
                label: 'Use cases',
                blurb: 'Commit / release signing, long-form provenance, self-notarization.',
            },
            {
                href: '/stamp/security',
                label: 'Security posture',
                blurb: 'Verification guarantees and what a stamp does NOT prove.',
            },
            {
                href: '/stamp/spec',
                label: 'Specification',
                blurb: 'Normative rules, canonicalization, error codes.',
            },
        ],
    },
    {
        slug: 'vote',
        label: 'OC Vote',
        blurb: 'Stake-weighted sybil-resistant polls.',
        items: [
            { href: '/vote', label: 'Overview', blurb: 'What Vote is and who it is for.' },
            {
                href: '/vote/why',
                label: 'Why OC Vote',
                blurb: 'What polls break without Bitcoin-stake weights.',
            },
            {
                href: '/vote/quickstart',
                label: 'Quickstart',
                blurb: 'Create a poll, cast a ballot, tally — all cross-impl-testable.',
            },
            {
                href: '/vote/weight-modes',
                label: 'Weight modes',
                blurb: 'one_per_address / sats / sats_days — how each resolves to a weight.',
            },
            {
                href: '/vote/tally-algorithm',
                label: 'Tally algorithm',
                blurb: 'Deterministic, pure, cross-impl-testable.',
            },
            {
                href: '/vote/secret-ballot',
                label: 'Secret ballot',
                blurb: 'Commit-reveal flow and the permanent-abandonment trade-off.',
            },
            {
                href: '/vote/integration',
                label: 'Integration guide',
                blurb: 'Dropping a Vote poll into your app, end to end.',
            },
            {
                href: '/vote/api',
                label: 'Library + CLI',
                blurb: 'The vote-core API surface and the oc-vote CLI.',
            },
            {
                href: '/vote/security',
                label: 'Security posture',
                blurb: 'Threat model, explicit non-goals, censorship boundary.',
            },
            {
                href: '/vote/spec',
                label: 'Specification',
                blurb: 'Normative rules and tally reference.',
            },
            {
                href: '/vote/protocol',
                label: 'Protocol walkthrough',
                blurb: 'Five flows with realistic addresses and block heights.',
            },
        ],
    },
    {
        slug: 'agent',
        label: 'OC Agent',
        blurb: 'Bitcoin-identity-bound delegation authority. Scoped, revocable, signed.',
        items: [
            {
                href: '/agent',
                label: 'Overview',
                blurb: 'Every agent gets a Bitcoin address. Every action, signed.',
            },
            {
                href: '/agent/why',
                label: 'Why OC Agent',
                blurb: 'Delegating to scripts / bots without surrendering the principal key.',
            },
            {
                href: '/agent/quickstart',
                label: 'Quickstart',
                blurb: 'Mint a delegation, sign an action envelope, verify downstream.',
            },
            {
                href: '/agent/scopes',
                label: 'Scope grammar',
                blurb: 'BNF for scopes, sub-scope containment, constraint semantics.',
            },
            {
                href: '/agent/protocol',
                label: 'Protocol walkthrough',
                blurb: 'The three envelopes and the two canonical flows.',
            },
            {
                href: '/agent/security',
                label: 'Security posture',
                blurb: 'Revocation, blast radius, and what scopes cannot contain.',
            },
            {
                href: '/agent/spec',
                label: 'Specification',
                blurb: 'Normative rules. Early draft — subject to change.',
            },
        ],
    },
    {
        slug: 'pledge',
        label: 'OC Pledge',
        blurb: 'Forward-looking commitment primitive. Pledge your word. Bond your stake. Anyone verifies the outcome.',
        items: [
            {
                href: '/pledge',
                label: 'Overview',
                blurb: 'Pledge your word to Bitcoin. Six verbs of sovereign sociality — Pledge is *swear*.',
            },
            {
                href: '/pledge/why',
                label: 'Why OC Pledge',
                blurb: 'No custody, no slashing, no aggregated reputation — enforcement by exposure only.',
            },
            {
                href: '/pledge/quickstart',
                label: 'Quickstart',
                blurb: 'Swear a pledge, publish, and verify the outcome end-to-end.',
            },
            {
                href: '/pledge/how-it-works',
                label: 'How it works',
                blurb: 'The canonical message, the seven resolution mechanisms, the outcome envelope.',
            },
            {
                href: '/pledge/resolution-grammar',
                label: 'Resolution grammar',
                blurb: 'chain_state, counterparty_signs, nostr_event_exists, stamp_published, http_get_hash, dns_record, vote_resolves.',
            },
            {
                href: '/pledge/state-machine',
                label: 'State machine',
                blurb: 'pending → resolvable → kept | broken | disputed | expired_unresolved.',
            },
            {
                href: '/pledge/enforcement-by-exposure',
                label: 'Enforcement by exposure',
                blurb: "Why bonds are signals, not stake to seize — and why that's the right call.",
            },
            {
                href: '/pledge/composition',
                label: 'Composition with the family',
                blurb: 'Stamp as resolution, Vote as dispute, Agent as delegated swearer.',
            },
            {
                href: '/pledge/security',
                label: 'Security posture',
                blurb: 'Address linkability, dispute-gaming, bond-draining attacks, mitigations.',
            },
            {
                href: '/pledge/spec',
                label: 'Specification',
                blurb: 'Normative rules; reference impls must pass the 28 conformance vectors.',
            },
        ],
    },
    {
        slug: 'sdks',
        label: 'SDKs',
        blurb: 'Drop-in packages for every protocol.',
        items: [
            {
                href: '/sdks',
                label: 'Overview',
                blurb: 'Map of every shipped package. Which stack to pick.',
            },
            {
                href: '/sdks/javascript',
                label: '@orangecheck/sdk',
                blurb: 'TypeScript core — check, verify, createAttestation.',
            },
            {
                href: '/sdks/python',
                label: 'orangecheck (Python)',
                blurb: 'Python SDK. Same surface, same conformance vectors.',
            },
            {
                href: '/sdks/gate',
                label: '@orangecheck/gate',
                blurb: 'HTTP middleware for Express / Next / Fastify / Hono / Workers.',
            },
            {
                href: '/sdks/react',
                label: '@orangecheck/react',
                blurb: '<OcBadge>, <OcGate>, <OcChallengeButton>.',
            },
            {
                href: '/sdks/cli',
                label: '@orangecheck/cli',
                blurb: '`oc` shell for scripts and one-shot checks.',
            },
            {
                href: '/sdks/wallet-adapter',
                label: '@orangecheck/wallet-adapter',
                blurb: 'Normalize UniSat / Xverse / Leather / Alby behind one sign API.',
            },
            {
                href: '/sdks/error-codes',
                label: 'Status & error codes',
                blurb: 'Every reason string `/api/check` and the SDKs can return.',
            },
        ],
    },
    {
        slug: 'reference',
        label: 'Reference',
        blurb: 'Glossary, FAQ, error codes, everything else.',
        items: [
            {
                href: '/reference/faq',
                label: 'FAQ',
                blurb: 'Common questions, answered directly.',
            },
            {
                href: '/reference/glossary',
                label: 'Glossary',
                blurb: 'Every term used across the docs.',
            },
        ],
    },
];

/** Flat ordered list — used for prev/next pagination. */
export const DOCS_FLAT: Array<{ href: string; label: string; section: string }> = DOCS_NAV.flatMap(
    (section) =>
        section.items.map((item) => ({
            href: item.href,
            label: item.label,
            section: section.label,
        }))
);

export function findDocsPage(pathname: string) {
    const normalized = pathname.replace(/\/$/, '') || '/';
    return DOCS_FLAT.find((p) => p.href === normalized);
}

export function findSectionFor(pathname: string): DocsSection | undefined {
    const normalized = pathname.replace(/\/$/, '') || '/';
    return DOCS_NAV.find((s) => s.items.some((i) => i.href === normalized));
}

export function prevNextFor(pathname: string) {
    const normalized = pathname.replace(/\/$/, '') || '/';
    const idx = DOCS_FLAT.findIndex((p) => p.href === normalized);
    if (idx === -1) return { prev: null, next: null };
    return {
        prev: idx > 0 ? DOCS_FLAT[idx - 1]! : null,
        next: idx < DOCS_FLAT.length - 1 ? DOCS_FLAT[idx + 1]! : null,
    };
}
