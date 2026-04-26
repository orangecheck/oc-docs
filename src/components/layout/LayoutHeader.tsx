'use client';

import { EcosystemSwitcher } from '@orangecheck/ui';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { cn } from '@/lib/utils/utils';

import { HeaderAccount } from '@/components/layout/HeaderAccount';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const PROTOCOLS = [
    { href: '/attest', label: 'Attest' },
    { href: '/lock', label: 'Lock' },
    { href: '/stamp', label: 'Stamp' },
    { href: '/vote', label: 'Vote' },
    { href: '/agent', label: 'Agent' },
    { href: '/pledge', label: 'Pledge' },
];

function isActive(pathname: string, href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
}

export function LayoutHeader() {
    const router = useRouter();
    const pathname = router.asPath.split('?')[0]!.split('#')[0]!;

    return (
        <header className="bg-background/90 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-40 w-full border-b backdrop-blur">
            <div className="container flex h-12 items-center justify-between gap-4">
                <Link
                    href="/"
                    className="flex items-center gap-2 font-mono text-sm font-bold tracking-tight"
                >
                    <span>
                        oc&middot;<span className="text-primary">docs</span>
                    </span>
                </Link>

                <nav className="hidden items-center gap-1 md:flex">
                    {PROTOCOLS.map((p) => {
                        const active = isActive(pathname, p.href);
                        return (
                            <Link
                                key={p.href}
                                href={p.href}
                                className={cn(
                                    'font-display px-3 py-1 text-[12px] font-semibold tracking-wider uppercase transition-colors',
                                    active
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                )}
                            >
                                {p.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-2">
                    <a
                        href="https://ochk.io"
                        className="text-muted-foreground hover:text-foreground hidden font-mono text-[11px] tracking-widest uppercase sm:inline"
                    >
                        ochk.io
                    </a>
                    <EcosystemSwitcher current="docs" />
                    <HeaderAccount />
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
