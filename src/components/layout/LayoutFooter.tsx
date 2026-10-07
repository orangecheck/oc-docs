import type { FooterColumn } from '@orangecheck/design';

import { OcFamilyFooter } from '@orangecheck/design';

const COLUMNS: FooterColumn[] = [
    {
        label: '§ protocols',
        links: [
            { href: '/attest', label: 'oc·attest' },
            { href: '/lock', label: 'oc·lock' },
            { href: '/vote', label: 'oc·vote' },
            { href: '/stamp', label: 'oc·stamp' },
            { href: '/agent', label: 'oc·agent' },
            { href: '/pledge', label: 'oc·pledge' },
        ],
    },
    {
        label: '§ products',
        links: [
            { href: '/me', label: 'oc·me' },
            { href: '/vault', label: 'oc·vault' },
            { href: '/chat', label: 'oc·chat' },
            { href: '/cosign', label: 'oc·cosign' },
        ],
    },
    {
        label: '§ docs',
        links: [
            { href: '/', label: 'overview' },
            { href: '/getting-started/quickstart', label: 'quickstart' },
            { href: '/getting-started/which-protocol', label: 'which protocol?' },
            { href: '/ecosystem', label: 'ecosystem (shared)' },
            { href: '/sdk', label: 'sdks' },
            { href: '/reference/faq', label: 'faq' },
            { href: '/reference/glossary', label: 'glossary' },
            { href: 'https://github.com/orangecheck', label: 'github', external: true },
        ],
    },
];

export function LayoutFooter() {
    return (
        <OcFamilyFooter
            brand={{
                mark: <span className="text-primary font-mono text-sm font-bold">§</span>,
                wordmark: (
                    <>
                        oc·<span className="text-primary">docs</span>
                    </>
                ),
                tagline: (
                    <>
                        One reference for the six protocols and the products built on them. Shared
                        concepts written once, cross-linked everywhere.
                    </>
                ),
                meta: (
                    <div className="text-muted-foreground flex gap-2 font-mono text-[10px] tracking-widest uppercase">
                        <span className="border px-1.5 py-0.5">mit</span>
                        <span className="border px-1.5 py-0.5">cc-by-4.0 specs</span>
                    </div>
                ),
            }}
            columns={COLUMNS}
            legalLinks={[
                { href: 'https://ochk.io/privacy', label: 'privacy' },
                { href: 'https://ochk.io/terms', label: 'terms' },
                { href: 'https://ochk.io/security', label: 'security' },
                { href: 'https://ochk.io/contact', label: 'contact' },
            ]}
        />
    );
}
