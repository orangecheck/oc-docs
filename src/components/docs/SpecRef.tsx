import { Callout, TextLink } from '@orangecheck/app-design/components';

type SpecKind = 'spec' | 'security' | 'rationale';

const DEFAULTS: Record<SpecKind, { file: string; title: string; note: string }> = {
    spec: {
        file: 'SPEC.md',
        title: 'Normative source',
        note: 'This page is a human-readable summary. The authoritative copy lives in the spec repo — if the two ever drift, the repo wins.',
    },
    security: {
        file: 'SECURITY.md',
        title: 'Normative threat model',
        note: 'This page is the short form. The authoritative, numbered threat model lives in the spec repo.',
    },
    rationale: {
        file: 'WHY.md',
        title: 'Design rationale',
        note: 'This page is the short version. The full rationale and the rejected-design log live in the spec repo.',
    },
};

/**
 * Where the normative copy of a page lives, said the same way on every
 * spec, security and rationale page:
 *
 *   <SpecRef repo="oc-vote-protocol" kind="spec" version="v0" />
 *
 * `file` overrides the kind's default file; `note` its sentence. A note, not
 * SpecCard: SpecCard links a protocol's repo, this links one file in any spec
 * repo (oc-chat-protocol is not a protocol of its own).
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
    return (
        <Callout title={version ? `${d.title} · ${version}` : d.title}>
            <p>{note ?? d.note}</p>
            <p>
                <TextLink
                    href={`https://github.com/orangecheck/${repo}/blob/main/${f}`}
                    className="font-mono text-[0.875rem] break-all"
                >
                    {`${repo}/${f}`}
                </TextLink>
            </p>
        </Callout>
    );
}
