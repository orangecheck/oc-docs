'use client';

import Link from 'next/link';

import { DOCS_NAV, findDocsPage } from './nav';

export function DocsBreadcrumb({ pathname }: { pathname: string }) {
    const current = findDocsPage(pathname);
    const section = DOCS_NAV.find((s) => s.items.some((i) => i.href === pathname));
    if (!current) {
        return (
            <nav
                aria-label="Breadcrumb"
                className="text-muted-foreground mb-4 flex items-center gap-2 font-mono text-[11px]"
            >
                <Link href="/" className="hover:text-foreground">
                    docs
                </Link>
            </nav>
        );
    }

    return (
        <nav
            aria-label="Breadcrumb"
            className="text-muted-foreground mb-4 flex items-center gap-2 font-mono text-[11px]"
        >
            <Link href="/" className="hover:text-foreground">
                docs
            </Link>
            {section && section.items[0]?.href !== current.href && (
                <>
                    <span className="opacity-50">/</span>
                    <Link href={section.items[0]?.href ?? '/'} className="hover:text-foreground">
                        {section.label.toLowerCase()}
                    </Link>
                </>
            )}
            <span className="opacity-50">/</span>
            <span className="text-foreground">{current.label.toLowerCase()}</span>
        </nav>
    );
}
