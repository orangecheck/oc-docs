'use client';

import { Github } from 'lucide-react';
import Link from 'next/link';

import { DOCS_NAV, findDocsPage } from './nav';
import { docSourceUrl } from './sources';

function SourceLink({ pathname }: { pathname: string }) {
    const href = docSourceUrl(pathname);
    if (!href) return null;
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] tracking-widest uppercase transition-colors"
        >
            <Github className="h-3 w-3" />
            <span className="hidden sm:inline">view source</span>
        </a>
    );
}

export function DocsBreadcrumb({ pathname }: { pathname: string }) {
    const current = findDocsPage(pathname);
    const section = DOCS_NAV.find((s) => s.items.some((i) => i.href === pathname));

    return (
        <div className="mb-4 flex items-center justify-between gap-4">
            <nav
                aria-label="Breadcrumb"
                className="text-muted-foreground flex min-w-0 items-center gap-2 font-mono text-[11px]"
            >
                <Link href="/" className="hover:text-foreground">
                    docs
                </Link>
                {current && section && section.items[0]?.href !== current.href && (
                    <>
                        <span className="opacity-50">/</span>
                        <Link
                            href={section.items[0]?.href ?? '/'}
                            className="hover:text-foreground"
                        >
                            {section.label.toLowerCase()}
                        </Link>
                    </>
                )}
                {current && (
                    <>
                        <span className="opacity-50">/</span>
                        <span className="text-foreground truncate">
                            {current.label.toLowerCase()}
                        </span>
                    </>
                )}
            </nav>
            <SourceLink pathname={pathname} />
        </div>
    );
}
