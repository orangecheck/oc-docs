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
            aria-label="view source on GitHub"
            className="text-muted-foreground hover:text-foreground -mr-3 inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 font-mono text-[11px] tracking-widest uppercase transition-colors sm:mr-0 sm:min-h-0 sm:min-w-0"
        >
            <Github className="h-3 w-3" />
            <span className="hidden sm:inline">view source</span>
        </a>
    );
}

// Crumbs stay one line of 11px type but get a phone-sized hit area.
const CRUMB = 'hover:text-foreground inline-flex min-h-11 items-center sm:min-h-0';

export function DocsBreadcrumb({ pathname }: { pathname: string }) {
    const current = findDocsPage(pathname);
    const section = DOCS_NAV.find((s) => s.items.some((i) => i.href === pathname));

    return (
        <div className="mb-2 flex items-center justify-between gap-4 sm:mb-4">
            <nav
                aria-label="Breadcrumb"
                className="text-muted-foreground flex min-w-0 items-center gap-2 font-mono text-[11px]"
            >
                <Link href="/" className={CRUMB}>
                    docs
                </Link>
                {current && section && section.items[0]?.href !== current.href && (
                    <>
                        <span className="opacity-50">/</span>
                        <Link href={section.items[0]?.href ?? '/'} className={CRUMB}>
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
