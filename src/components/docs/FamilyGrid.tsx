import { StatusPill, Surface } from '@orangecheck/design';
import Link from 'next/link';

/**
 * The six-verb family as a soft card grid (replaces the markdown spec-table on
 * the overview page). Token-adaptive: sharp/flat under the cypherpunk skins,
 * soft/warm under ember.
 */
const FAMILY: { name: string; verb: string; href: string; what: string }[] = [
    {
        name: 'OC Attest',
        verb: 'am',
        href: '/attest',
        what: "Sybil resistance via proof of Bitcoin stake. Sign one message; any verifier can check that you've held N sats for N days.",
    },
    {
        name: 'OC Lock',
        verb: 'whisper',
        href: '/lock',
        what: 'End-to-end encryption addressed to a Bitcoin address. Sealed envelopes only the key-holder of a specific address can unseal.',
    },
    {
        name: 'OC Vote',
        verb: 'decide',
        href: '/vote',
        what: 'Stake-weighted, sybil-resistant polls. Three canonical weight modes. Deterministic, cross-impl-testable tally.',
    },
    {
        name: 'OC Stamp',
        verb: 'declare',
        href: '/stamp',
        what: 'Bitcoin-block-anchored signed statements. BIP-322 + OpenTimestamps. Immutable authorship + priority.',
    },
    {
        name: 'OC Agent',
        verb: 'delegate',
        href: '/agent',
        what: 'Bitcoin-identity-bound delegation authority. Scoped rights, bonded to sats, revocable on-demand. Every action is signed.',
    },
    {
        name: 'OC Pledge',
        verb: 'swear',
        href: '/pledge',
        what: 'Forward-looking commitment primitive. BIP-322-signed declarations about future-verifiable propositions, bonded to an OC Attest.',
    },
];

export function FamilyGrid() {
    return (
        <div className="not-prose my-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FAMILY.map((p) => (
                <Surface key={p.href} elevation="sm" pad="md" className="flex h-full flex-col">
                    <div className="flex items-start justify-between gap-3">
                        <Link
                            href={p.href}
                            className="font-display text-foreground hover:text-primary text-base font-bold tracking-wide no-underline transition-colors"
                        >
                            {p.name}
                        </Link>
                        <StatusPill label="live" tone="success" variant="bordered" />
                    </div>
                    <div className="label-mono text-primary mt-1">{p.verb}</div>
                    <p className="text-muted-foreground mt-3 text-sm leading-snug">{p.what}</p>
                </Surface>
            ))}
        </div>
    );
}
