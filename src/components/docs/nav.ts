/**
 * Docs sitemap — source of truth for the sidebar, breadcrumbs, and prev/next.
 *
 * Top-level reading order:
 *   1. Getting started · Ecosystem (shared)              — landing + plumbing
 *   2. Protocols · Attest / Lock / Stamp / Vote / Agent / Pledge — six siblings
 *   3. Commercial products · Fleet / Me / Vault         — managed offerings
 *   4. SDKs                                              — ship-ready packages
 *   5. Company · Charter                                 — cross-product commitments
 *   6. Reference · FAQ / Glossary                        — everything else
 *
 * Every entry MUST correspond to a real .mdx file under src/pages/. When
 * you delete a page, remove the nav entry in the same commit. When you
 * add a page, add the nav entry in the same commit so it shows up in the
 * sidebar.
 *
 * Invariants:
 *   1. Every `href` corresponds to an existing `.mdx` (or `.tsx`) file.
 *   2. Section slugs are the URL root for that section (e.g. `attest`
 *      maps to everything under `/attest/*`). The exception is `company`,
 *      which collects cross-product pages (charter today; legal/about
 *      eventually) — its items live at the docs root, not under /company/*.
 *   3. Protocol sections lead with overview → concepts → API → guides.
 *   4. Commercial product sections (fleet, me) lead with overview →
 *      quickstart → SDK reference → integrations → webhooks → API → custody.
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
        slug: 'integration',
        label: 'Integration',
        blurb: 'Bring OrangeCheck identity into your app.',
        items: [
            {
                href: '/integration',
                label: 'Overview',
                blurb: 'The two integration pathways — which one is yours.',
            },
            {
                href: '/connect',
                label: 'OrangeCheck Connect',
                blurb: 'Layer a Bitcoin-backed did:oc on top of Google, Auth0, email/password — any login.',
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
                href: '/agent/private-scope',
                label: 'Private scope',
                blurb: 'Scope tokens that never appear in the wire envelope; verifier resolves locally.',
            },
            {
                href: '/agent/sub-delegation',
                label: 'Sub-delegation (v1.1)',
                blurb: 'Agents that delegate to other agents — additive extension on kind 30086.',
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
        slug: 'fleet',
        label: 'OC Fleet',
        blurb: 'Managed infrastructure for the OC Agent family. The commercial layer.',
        items: [
            {
                href: '/fleet',
                label: 'Overview',
                blurb: "What fleet is, what it isn't, and where it fits.",
            },
            {
                href: '/fleet/quickstart',
                label: 'Quickstart',
                blurb: 'Sign in, bootstrap, register your first delegation, see receipts flow.',
            },
            {
                href: '/fleet/integrations',
                label: 'Integrations',
                blurb: 'Drop-in adapters for Anthropic / OpenAI / Vercel AI SDK / LangGraph / MCP.',
            },
            {
                href: '/fleet/reputation',
                label: 'Bonded reputation',
                blurb: 'Compose / persist / surface OC Pledge envelopes — the bonded-delivery slice of fleet.',
            },
            {
                href: '/fleet/bond',
                label: 'Bond verification',
                blurb: 'GET /api/bond — re-resolve a bond against live bitcoin UTXO state. The load-bearing leg.',
            },
            {
                href: '/fleet/compliance',
                label: 'Compliance crosswalk',
                blurb: 'Fleet artifacts mapped to EU AI Act / SOC 2 / NIST AI RMF — with honest rails. The procurement exit.',
            },
            {
                href: '/fleet/interop',
                label: 'Interop credential',
                blurb: 'How an OC delegation+bond rides into x402 / AP2 / A2A / ERC-8004 as a portable, offline-verifiable credential. Design intent.',
            },
            {
                href: '/fleet/webhooks',
                label: 'Webhooks',
                blurb: 'Receive HMAC-signed deliveries on every accepted envelope.',
            },
            {
                href: '/fleet/api',
                label: 'API reference',
                blurb: 'OpenAPI 3.1 spec, auth schemes, error codes, route catalog.',
            },
        ],
    },
    {
        slug: 'me',
        label: 'OC Me',
        blurb: 'Consumer commercial product · bitcoin-backed identity that pays users in sats.',
        items: [
            {
                href: '/me',
                label: 'Overview',
                blurb: "What me.ochk.io is, what it isn't, and where it fits.",
            },
            {
                href: '/me/quickstart',
                label: 'Quickstart',
                blurb: 'Five minutes from npm install to first envelope.',
            },
            {
                href: '/me/sdk',
                label: 'SDK reference',
                blurb: '@orangecheck/me-client v0.5.0 — every export, every type, every code sample.',
            },
            {
                href: '/me/integrations',
                label: 'Integrations',
                blurb: 'OAuth-peer pattern, sample integrator archetypes, cross-product flows.',
            },
            {
                href: '/me/webhooks',
                label: 'Webhooks',
                blurb: 'Reception in Node + Rust, raw-body warning, retry semantics.',
            },
            {
                href: '/me/drops',
                label: 'Drop periods',
                blurb: 'Batch payouts into scheduled windows — vesting, block boundaries, signed manifests, proofs.',
            },
            {
                href: '/me/api',
                label: 'HTTP API',
                blurb: 'Every me.ochk.io endpoint · auth, rate limits, response shapes.',
            },
            {
                href: '/me/custody',
                label: 'Federation custody',
                blurb: 'Federation descriptor, M-of-N graduation envelope, guardian rotation.',
            },
            {
                href: '/me/operator',
                label: 'Operator',
                blurb: 'Provision + run a federation: seats → charter → DKG → live. Lifecycle in-browser; bypass parity via the kit.',
            },
            {
                href: '/me/operator/charter',
                label: 'Federation charter',
                blurb: 'Canonical text every guardian ratifies. Hash + version live on each federation record.',
            },
            {
                href: '/me/operator/runbook',
                label: 'Operator runbook',
                blurb: 'Run the oc-guardian binary on hardware you control. Docker, cosign, healthz.',
            },
            {
                href: '/me/operator/in-browser',
                label: 'In-browser flow',
                blurb: 'How the portal runs the entire operator lifecycle without a CLI. Storage, round-trip, recovery.',
            },
        ],
    },
    {
        slug: 'vault',
        label: 'OC Vault',
        blurb: 'Consumer commercial product · Bitcoin-bound encrypted secrets vault. Your wallet is your master password.',
        items: [
            {
                href: '/vault',
                label: 'Overview',
                blurb: 'What vault.ochk.io is — OC Lock Flow 4 productized. Entry types, tooling, pricing.',
            },
            {
                href: '/vault/quickstart',
                label: 'Quickstart',
                blurb: 'Sign in with Bitcoin, add an entry, audit passwords, turn on cloud sync, export a backup.',
            },
            {
                href: '/vault/extension',
                label: 'Browser extension',
                blurb: 'Manifest V3 extension — autofill, capture, your full vault one toolbar click away.',
            },
            {
                href: '/vault/protocol',
                label: 'Protocol',
                blurb: 'Flow 4, the entry envelope, the double-encrypted cloud blob, the portable export format.',
            },
            {
                href: '/vault/security',
                label: 'Security',
                blurb: 'Threat model, what is sealed vs exposed, the no-backdoor recovery tradeoff, k-anonymity breach checks.',
            },
            {
                href: '/vault/developer',
                label: 'Developer platform',
                blurb: 'The oc-vault CLI, the vault-core SDK, ocv:// references, access tokens, and the GitHub Action.',
            },
        ],
    },
    {
        slug: 'chat',
        label: 'OC Chat',
        blurb: 'Consumer commercial product · your Bitcoin address is your inbox. E2EE messaging, Lightning postage, a block-height seal. A mode of OC Lock, not a seventh verb.',
        items: [
            {
                href: '/chat',
                label: 'Overview',
                blurb: 'What chat.ochk.io is — OC Lock + threads + postage + a block-height seal. The three modes, the layers, the honest-by-design posture, pricing.',
            },
            {
                href: '/chat/why',
                label: 'Why OC Chat',
                blurb: 'The lock.ochk.io chat postmortem → a real messenger; why chat is a mode of OC Lock; the Ed25519 substitution test run out loud on the seal.',
            },
            {
                href: '/chat/quickstart',
                label: 'Quickstart',
                blurb: 'Sign in with Bitcoin, send your first E2EE message, try each of the three send modes.',
            },
            {
                href: '/chat/how-it-works',
                label: 'How it works',
                blurb: 'Device key → inbox → directory → gift-wrap → threading. One signature, then zero-click forever.',
            },
            {
                href: '/chat/modes',
                label: 'The three send modes',
                blurb: 'speak-now / pay-to-reach / seal-til-block — each adding exactly one Bitcoin-unique property.',
            },
            {
                href: '/chat/threading',
                label: 'Threading & attachments',
                blurb: 'The parent_id hash-chain inside the ciphertext, conversation ids, E2EE inline files.',
            },
            {
                href: '/chat/postage',
                label: 'Postage (pay-to-reach)',
                blurb: 'Lightning postage paid direct to the recipient, the offline six-step verification, the replay ceiling, the named-Fedimint fallback. OC operates no rail.',
            },
            {
                href: '/chat/seal',
                label: 'Seal-til-block',
                blurb: 'The named beacon, the v0 drand-tlock profile, the hard chain gate, redundant beacons, standing delivery (dead-man’s-switch).',
            },
            {
                href: '/chat/directory',
                label: 'Discoverability directory',
                blurb: 'Opt-in, UTXO-gated, revocable by-handle discovery; the social-graph firewall; forward-only revocation; the deanonymization disclosures.',
            },
            {
                href: '/chat/channels',
                label: 'Channels',
                blurb: 'Founder-rooted public channels — the kind-30110 descriptor, write policies, roles, moderation, directory composition, source-intake.',
            },
            {
                href: '/chat/transport',
                label: 'Transport & durable inbox',
                blurb: 'Gift-wrap, the v2 encrypted wrap, opaque per-conversation queue routing, NIP-42 relay AUTH.',
            },
            {
                href: '/chat/envelope',
                label: 'Envelope & content addressing',
                blurb: 'The two new kinds and the recipient-exclusion id/AAD rule that makes a held envelope re-wrap-safe.',
            },
            {
                href: '/chat/protocol',
                label: 'Protocol walkthrough',
                blurb: 'The six flows narrated end to end — speak-now through institutional source-intake.',
            },
            {
                href: '/chat/security',
                label: 'Security posture',
                blurb: 'The threat model and every named non-protection — no per-message FS, the beacon-trust seal, the postage ceiling, the channel boundary, the custody line.',
            },
            {
                href: '/chat/spec',
                label: 'Specification',
                blurb: 'Normative rules, error codes, the 30110–30115 kind registry, the compliance checklist.',
            },
        ],
    },
    {
        slug: 'api-reference',
        label: 'API reference',
        blurb: 'Machine-readable OpenAPI 3.1 specs + interactive explorers, one per product / protocol surface that ships HTTP APIs.',
        items: [
            {
                href: '/api-reference',
                label: 'Overview',
                blurb: 'Map of every OpenAPI spec in the family. How to generate clients with openapi-generator.',
            },
            {
                href: '/api-reference/auth-host',
                label: 'ochk.io · auth host',
                blurb: 'Family auth host — sign-in (BIP-322 + email-OTP), JWKS, challenge primitive, account ops, contact form.',
            },
            {
                href: '/api-reference/attest',
                label: 'attest.ochk.io · OC Attest',
                blurb: 'Verification API — check / verify / discover / publish-attestation / stats.',
            },
            {
                href: '/api-reference/fleet',
                label: 'fleet.ochk.io · Fleet',
                blurb: 'Managed agent + pledge infrastructure — delegations, actions, revocations, pledges (V1) + outcomes / abandonments (V2), audit, webhooks.',
            },
        ],
    },
    // The /sdk group: curated overview + per-package TypeDoc reference.
    // The per-@orangecheck-package items below are auto-generated from
    // oc-packages/scripts/gen-docs.mjs (TypeDoc → MDX). The Python and
    // CLI entries are hand-written one-pagers (no TypeDoc input).
    {
        slug: 'sdk',
        label: 'SDKs',
        blurb: 'Every shipped package — TypeScript, Python, CLIs — with the curated map + auto-generated reference.',
        items: [
            {
                href: '/sdk',
                label: 'Overview',
                blurb: 'Curated which-package-for-which-job map, plus how the auto-gen reference is laid out.',
            },
            // ── languages without TypeDoc input ────────────────────────
            {
                href: '/sdk/python',
                label: 'orangecheck (Python)',
                blurb: 'Python SDK. Same surface as @orangecheck/sdk, same conformance vectors.',
            },
            {
                href: '/sdk/cli',
                label: '@orangecheck/cli',
                blurb: '`oc` shell — check / verify / create / challenge / discover.',
            },
            // ── core ───────────────────────────────────────────────────
            {
                href: '/sdk/sdk/README',
                label: '@orangecheck/sdk',
                blurb: 'TypeScript core — check, verify, createAttestation, scoring, identity helpers.',
            },
            {
                href: '/sdk/auth-core/README',
                label: '@orangecheck/auth-core',
                blurb: 'Ed25519 JWT verify + cookie helpers — consumer half of the ochk.io auth host.',
            },
            {
                href: '/sdk/auth-client/README',
                label: '@orangecheck/auth-client',
                blurb: 'React provider + hooks for cross-subdomain auth via the ochk.io host.',
            },
            {
                href: '/sdk/nostr-core/README',
                label: '@orangecheck/nostr-core',
                blurb: 'Browser Nostr client (publishEvent, queryEvents, DEFAULT_RELAYS).',
            },
            // ── agent (oc-agent-protocol) ──────────────────────────────
            {
                href: '/sdk/agent-core/README',
                label: '@orangecheck/agent-core',
                blurb: 'OC Agent canonical messages, envelope formats, scope grammar, verification.',
            },
            {
                href: '/sdk/agent-signer/README',
                label: '@orangecheck/agent-signer',
                blurb: 'Producer-side signer — wraps a wallet to emit agent-action envelopes.',
            },
            {
                href: '/sdk/agent-mcp/README',
                label: '@orangecheck/agent-mcp',
                blurb: 'Model Context Protocol bindings for agent envelopes.',
            },
            {
                href: '/sdk/agent-anthropic/README',
                label: '@orangecheck/agent-anthropic',
                blurb: 'Adapter for Anthropic SDK tool-use canonicalization.',
            },
            {
                href: '/sdk/agent-openai/README',
                label: '@orangecheck/agent-openai',
                blurb: 'Adapter for OpenAI SDK tool-call canonicalization.',
            },
            {
                href: '/sdk/agent-langgraph/README',
                label: '@orangecheck/agent-langgraph',
                blurb: 'Adapter for LangGraph tool-call canonicalization.',
            },
            {
                href: '/sdk/agent-vercel/README',
                label: '@orangecheck/agent-vercel',
                blurb: 'Adapter for Vercel AI SDK tool-call canonicalization.',
            },
            // ── lock (oc-lock-protocol) ────────────────────────────────
            {
                href: '/sdk/lock-core/README',
                label: '@orangecheck/lock-core',
                blurb: 'OC Lock envelope format, canonicalization, seal, unseal.',
            },
            {
                href: '/sdk/lock-crypto/README',
                label: '@orangecheck/lock-crypto',
                blurb: 'Crypto primitives for OC Lock — X25519, AEAD, KDF.',
            },
            {
                href: '/sdk/lock-device/README',
                label: '@orangecheck/lock-device',
                blurb: 'Device-key management for OC Lock recipients.',
            },
            // ── vault (oc-vault) ───────────────────────────────────────
            {
                href: '/sdk/vault-core/README',
                label: '@orangecheck/vault-core',
                blurb: 'OC Vault crypto, entry model, ocv:// secret-reference resolver, API client.',
            },
            // ── stamp (oc-stamp-protocol) ──────────────────────────────
            {
                href: '/sdk/stamp-core/README',
                label: '@orangecheck/stamp-core',
                blurb: 'OC Stamp envelope format, canonicalization, verification.',
            },
            {
                href: '/sdk/stamp-ots/README',
                label: '@orangecheck/stamp-ots',
                blurb: 'OpenTimestamps anchor pipeline for OC Stamp envelopes.',
            },
            // ── vote (oc-vote-protocol) ────────────────────────────────
            {
                href: '/sdk/vote-core/README',
                label: '@orangecheck/vote-core',
                blurb: 'OC Vote canonicalization, ids, weight modes, deterministic tally.',
            },
            {
                href: '/sdk/vote-react/README',
                label: '@orangecheck/vote-react',
                blurb: 'React components for OC Vote — badge, poll, useTally.',
            },
            // ── pledge (oc-pledge-protocol) ────────────────────────────
            {
                href: '/sdk/pledge-core/README',
                label: '@orangecheck/pledge-core',
                blurb: 'OC Pledge canonical messages, envelope formats, state machine, bond verification.',
            },
            // ── me (me.ochk.io consumer product) ───────────────────────
            {
                href: '/sdk/me-client/README',
                label: '@orangecheck/me-client',
                blurb: 'me.ochk.io client SDK — auth, accounts, billable events.',
            },
            // ── integrations + UI ──────────────────────────────────────
            {
                href: '/sdk/gate/README',
                label: '@orangecheck/gate',
                blurb: 'HTTP middleware for Express / Next / Fastify / Hono.',
            },
            {
                href: '/sdk/airdrop-gate/README',
                label: '@orangecheck/airdrop-gate',
                blurb: 'Sybil-resistant airdrop allowlist filter.',
            },
            {
                href: '/sdk/relay-filter/README',
                label: '@orangecheck/relay-filter',
                blurb: 'Strfry write-policy plugin to gate Nostr relays by OC attestation.',
            },
            {
                href: '/sdk/wallet-adapter/README',
                label: '@orangecheck/wallet-adapter',
                blurb: 'Normalize UniSat / Xverse / Leather / OKX behind one sign API.',
            },
            {
                href: '/sdk/webhook-verify/README',
                label: '@orangecheck/webhook-verify',
                blurb: 'HMAC verification helpers for OC webhook deliveries.',
            },
            {
                href: '/sdk/react/README',
                label: '@orangecheck/react',
                blurb: 'Generic React components — OcBadge, OcGate, OcChallengeButton.',
            },
            {
                href: '/sdk/ui/README',
                label: '@orangecheck/design',
                blurb: 'Shared shadcn-style UI primitives across the family.',
            },
        ],
    },
    // AUTOGEN-SDK-END

    {
        slug: 'reference',
        label: 'Reference',
        blurb: 'Charter, glossary, FAQ, error codes, infrastructure — the cross-cutting reference cluster.',
        items: [
            {
                href: '/charter',
                label: 'Charter',
                blurb: 'The eight commitments OrangeCheck makes — single source of truth, binds every product (me, fleet, every protocol sibling).',
            },
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
            {
                href: '/reference/error-codes',
                label: 'Status & error codes',
                blurb: 'Every reason string `/api/check`, `/api/verify`, and the SDKs can return.',
            },
            {
                href: '/reference/multi-account',
                label: 'Multi-account sign-in',
                blurb: 'Hold multiple OrangeCheck accounts in one browser and switch between them without re-auth. Roster model, wire surface, every family site gets it for free.',
            },
            {
                href: '/infrastructure/relay',
                label: 'relay.ochk.io',
                blurb: "OC's family Nostr relay. Kind-allowlisted, d-tag-prefix-gated, never the only copy.",
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
