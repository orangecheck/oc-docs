import Link from 'next/link';

const ECOSYSTEM = [
    { href: 'https://ochk.io', label: 'ochk.io — umbrella', external: true },
    { href: 'https://lock.ochk.io', label: 'lock.ochk.io', external: true },
    { href: 'https://stamp.ochk.io', label: 'stamp.ochk.io', external: true },
    { href: 'https://github.com/orangecheck', label: 'github org ↗', external: true },
];

const DOCS_TOP = [
    { href: '/getting-started/quickstart', label: 'quickstart' },
    { href: '/getting-started/which-protocol', label: 'which protocol?' },
    { href: '/ecosystem', label: 'ecosystem' },
    { href: '/reference/faq', label: 'faq' },
    { href: '/reference/glossary', label: 'glossary' },
];

const PROTOCOLS = [
    { href: '/attest', label: 'OC Attest' },
    { href: '/lock', label: 'OC Lock' },
    { href: '/stamp', label: 'OC Stamp' },
    { href: '/vote', label: 'OC Vote' },
    { href: '/agent', label: 'OC Agent' },
];

export function LayoutFooter() {
    return (
        <footer className="border-t">
            <div className="container py-12">
                <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 font-mono text-sm font-bold">
                            <span className="text-primary">§</span>
                            <span>orangecheck docs</span>
                        </div>
                        <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
                            Unified documentation for the OrangeCheck ecosystem — Attest, Lock,
                            Stamp, Vote, Agent. Shared concepts written once, cross-linked
                            everywhere.
                        </p>
                        <div className="text-muted-foreground flex gap-2 font-mono text-[10px] tracking-widest uppercase">
                            <span className="border px-1.5 py-0.5">mit</span>
                            <span className="border px-1.5 py-0.5">cc-by-4.0 specs</span>
                        </div>
                    </div>

                    <div>
                        <div className="label-mono text-primary mb-3">§ docs</div>
                        <ul className="space-y-2 font-mono text-[12px]">
                            {DOCS_TOP.map((l) => (
                                <li key={l.href}>
                                    <Link
                                        href={l.href}
                                        className="text-muted-foreground hover:text-foreground inline-block transition-colors"
                                    >
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <div className="label-mono text-primary mb-3">§ protocols</div>
                        <ul className="space-y-2 font-mono text-[12px]">
                            {PROTOCOLS.map((l) => (
                                <li key={l.href}>
                                    <Link
                                        href={l.href}
                                        className="text-muted-foreground hover:text-foreground inline-block transition-colors"
                                    >
                                        {l.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <div className="label-mono text-primary mb-3">§ ecosystem</div>
                        <ul className="space-y-2 font-mono text-[12px]">
                            {ECOSYSTEM.map((l) => (
                                <li key={l.href}>
                                    <a
                                        href={l.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-foreground inline-block transition-colors"
                                    >
                                        {l.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="text-muted-foreground mt-10 flex flex-col items-start justify-between gap-2 border-t pt-6 font-mono text-[11px] sm:flex-row sm:items-center">
                    <span>© 2026 orangecheck · mit + cc-by-4.0</span>
                    <span className="inline-flex items-center gap-1.5">
                        <span className="text-primary text-[13px] leading-none">₿</span>
                        <span className="tracking-widest uppercase">built with bitcoin</span>
                    </span>
                </div>
            </div>
        </footer>
    );
}
