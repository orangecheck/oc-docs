import { FileText } from 'lucide-react';

type SpecKind = 'spec' | 'security' | 'rationale';

const DEFAULTS: Record<SpecKind, { file: string; eyebrow: string; note: string }> = {
    spec: {
        file: 'SPEC.md',
        eyebrow: 'normative source',
        note: 'This page is a human-readable summary. The authoritative copy lives in the spec repo — if the two ever drift, the repo wins.',
    },
    security: {
        file: 'SECURITY.md',
        eyebrow: 'normative threat model',
        note: 'This page is the short form. The authoritative, numbered threat model lives in the spec repo.',
    },
    rationale: {
        file: 'WHY.md',
        eyebrow: 'design rationale',
        note: 'This page is the short version. The full rationale and the rejected-design log live in the spec repo.',
    },
};

/**
 * Consistent "where the normative copy lives" callout for every docs page
 * that mirrors or points at an upstream spec-repo document. Replaces the
 * ad-hoc inline "the authoritative copy is SPEC.md…" sentences that each
 * spec/security/why page used to hand-write differently.
 *
 *   <SpecRef repo="oc-vote-protocol" kind="spec" version="v0" />
 *   <SpecRef repo="oc-lock-protocol" kind="security" />
 *
 * `file` overrides the default file for the kind; `note` overrides the
 * default sentence. The verb stays "view": this links the source, it
 * doesn't claim the docs page is editable upstream.
 */
export function SpecRef({
    repo,
    kind = 'spec',
    file,
    version,
    note,
}: {
    repo: string;
    kind?: SpecKind;
    file?: string;
    version?: string;
    note?: string;
}) {
    const d = DEFAULTS[kind];
    const f = file ?? d.file;
    const href = `https://github.com/orangecheck/${repo}/blob/main/${f}`;
    const label = `${repo}/${f}`;

    return (
        <aside className="bg-muted/40 my-6 border-l-4 border-orange-500 py-4 pr-4 pl-5">
            <div className="text-muted-foreground mb-2 font-mono text-[10px] tracking-widest uppercase">
                {d.eyebrow}
                {version ? ` · ${version}` : ''}
            </div>
            <p className="text-muted-foreground mb-3 text-sm leading-6">{note ?? d.note}</p>
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 inline-flex items-center gap-2 font-mono text-sm break-all"
            >
                <FileText className="h-3.5 w-3.5 shrink-0" />
                {label}
                <span aria-hidden className="not-italic">
                    ↗
                </span>
            </a>
        </aside>
    );
}
