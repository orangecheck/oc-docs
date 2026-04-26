import Link from 'next/link';

interface FooterLink {
    href: string;
    label: string;
    external?: boolean;
}

const PROTOCOLS: FooterLink[] = [
    { href: '/attest', label: 'oc·attest' },
    { href: '/lock', label: 'oc·lock' },
    { href: '/vote', label: 'oc·vote' },
    { href: '/stamp', label: 'oc·stamp' },
    { href: '/agent', label: 'oc·agent' },
    { href: '/pledge', label: 'oc·pledge' },
];

const DOCS: FooterLink[] = [
    { href: '/', label: 'overview' },
    { href: '/getting-started/quickstart', label: 'quickstart' },
    { href: '/getting-started/which-protocol', label: 'which protocol?' },
    { href: '/ecosystem', label: 'ecosystem (shared)' },
    { href: '/sdks', label: 'sdks' },
    { href: '/reference/faq', label: 'faq' },
    { href: '/reference/glossary', label: 'glossary' },
];

const ECOSYSTEM: FooterLink[] = [
    { href: 'https://ochk.io', label: 'ochk.io — umbrella' },
    { href: 'https://attest.ochk.io', label: 'attest.ochk.io' },
    { href: 'https://lock.ochk.io', label: 'lock.ochk.io' },
    { href: 'https://vote.ochk.io', label: 'vote.ochk.io' },
    { href: 'https://stamp.ochk.io', label: 'stamp.ochk.io' },
    { href: 'https://agent.ochk.io', label: 'agent.ochk.io' },
    { href: 'https://pledge.ochk.io', label: 'pledge.ochk.io' },
    {
        href: 'https://github.com/orangecheck',
        label: 'github org',
        external: true,
    },
];

function FooterItem({ link }: { link: FooterLink }) {
    const cls = 'text-muted-foreground hover:text-foreground inline-block transition-colors';
    if (link.external) {
        return (
            <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
                {link.label} ↗
            </a>
        );
    }
    return (
        <Link href={link.href} className={cls}>
            {link.label}
        </Link>
    );
}

export function LayoutFooter() {
    return (
        <footer className="border-t">
            <div className="container py-12">
                <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 font-mono text-sm font-bold">
                            <span className="text-primary">§</span>
                            <span>
                                oc&middot;<span className="text-primary">docs</span>
                            </span>
                        </div>
                        <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
                            Unified documentation for the OrangeCheck ecosystem — Attest, Lock,
                            Vote, Stamp, Agent, Pledge. Shared concepts written once, cross-linked
                            everywhere.
                        </p>
                        <div className="text-muted-foreground flex gap-2 font-mono text-[10px] tracking-widest uppercase">
                            <span className="border px-1.5 py-0.5">mit</span>
                            <span className="border px-1.5 py-0.5">cc-by-4.0 specs</span>
                        </div>
                    </div>

                    <div>
                        <div className="label-mono text-primary mb-3">§ protocols</div>
                        <ul className="space-y-2 font-mono text-[12px]">
                            {PROTOCOLS.map((l) => (
                                <li key={l.href}>
                                    <FooterItem link={l} />
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <div className="label-mono text-primary mb-3">§ docs</div>
                        <ul className="space-y-2 font-mono text-[12px]">
                            {DOCS.map((l) => (
                                <li key={l.href}>
                                    <FooterItem link={l} />
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <div className="label-mono text-primary mb-3">§ ecosystem</div>
                        <ul className="space-y-2 font-mono text-[12px]">
                            {ECOSYSTEM.map((l) => (
                                <li key={l.href}>
                                    <FooterItem link={l} />
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t pt-6 font-mono text-[11px] tracking-widest uppercase sm:flex-row sm:items-center">
                    <span className="text-muted-foreground">
                        © {new Date().getFullYear()} orangecheck · mit + cc-by-4.0
                    </span>
                    <div className="text-muted-foreground/80 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <a
                            href="https://ochk.io/privacy"
                            className="hover:text-foreground transition-colors"
                        >
                            privacy
                        </a>
                        <a
                            href="https://ochk.io/terms"
                            className="hover:text-foreground transition-colors"
                        >
                            terms
                        </a>
                        <a
                            href="https://ochk.io/security"
                            className="hover:text-foreground transition-colors"
                        >
                            security
                        </a>
                        <a
                            href="https://ochk.io/contact"
                            className="hover:text-foreground transition-colors"
                        >
                            contact
                        </a>
                    </div>
                    <span className="text-muted-foreground inline-flex items-center gap-1.5">
                        <span className="text-primary text-[13px] leading-none">₿</span>
                        <span>built with bitcoin</span>
                    </span>
                </div>
            </div>
        </footer>
    );
}
