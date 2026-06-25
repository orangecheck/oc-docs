'use client';

import Link from 'next/link';

import { prevNextFor } from './nav';

export function DocsPagination({ pathname }: { pathname: string }) {
    const { prev, next } = prevNextFor(pathname);
    if (!prev && !next) return null;

    return (
        <nav className="mt-16 grid gap-4 border-t pt-8 font-mono sm:grid-cols-2">
            {prev ? (
                <Link
                    href={prev.href}
                    className="group hover:border-primary/40 bg-card block rounded-xl border p-4 shadow-sm transition-colors"
                >
                    <div className="text-muted-foreground mb-1 text-[10px] tracking-widest uppercase">
                        ← prev · {prev.section}
                    </div>
                    <div className="font-display text-foreground group-hover:text-primary text-base font-bold">
                        {prev.label}
                    </div>
                </Link>
            ) : (
                <div />
            )}
            {next ? (
                <Link
                    href={next.href}
                    className="group hover:border-primary/40 bg-card block rounded-xl border p-4 text-right shadow-sm transition-colors"
                >
                    <div className="text-muted-foreground mb-1 text-[10px] tracking-widest uppercase">
                        next · {next.section} →
                    </div>
                    <div className="font-display text-foreground group-hover:text-primary text-base font-bold">
                        {next.label}
                    </div>
                </Link>
            ) : (
                <div />
            )}
        </nav>
    );
}
