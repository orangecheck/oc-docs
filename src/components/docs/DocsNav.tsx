'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';

import { cn } from '@/lib/utils/utils';

import { DOCS_NAV } from './nav';

/**
 * Sidebar with collapsible per-section groups. The section the route is
 * currently inside is always open; every other section is collapsed by
 * default. Users can manually peek into other sections, but that peek
 * state resets whenever the active section changes — landing on a deep
 * page like /lock/envelope-format always shows just the OC Lock group,
 * with the active item scrolled into view.
 */
function currentSectionSlug(currentPath: string): string | null {
    const normalized = currentPath.replace(/\/$/, '') || '/';
    const hit = DOCS_NAV.find((s) => s.items.some((i) => i.href === normalized));
    return hit?.slug ?? null;
}

export function DocsNav({ onNavigate }: { onNavigate?: () => void }) {
    const router = useRouter();
    const currentPath = router.asPath.split('?')[0]!.split('#')[0]!;
    const activeSection = useMemo(() => currentSectionSlug(currentPath), [currentPath]);

    // Sections the user has manually expanded for peeking. The active
    // section is always rendered open implicitly, so it never lives here.
    // Reset on active-section change so peeking doesn't accumulate.
    const [peeked, setPeeked] = useState<Set<string>>(() => new Set());
    useEffect(() => {
        setPeeked(new Set());
    }, [activeSection]);

    const toggle = (slug: string) => {
        if (slug === activeSection) return; // active section can't be collapsed
        setPeeked((prev) => {
            const next = new Set(prev);
            if (next.has(slug)) next.delete(slug);
            else next.add(slug);
            return next;
        });
    };

    // Scroll the active item into view inside whichever scroll container
    // the sidebar lives in (desktop <aside> or mobile drawer).
    const activeItemRef = useRef<HTMLAnchorElement | null>(null);
    useEffect(() => {
        const el = activeItemRef.current;
        if (!el) return;
        // Defer one frame so the open section has laid out before we measure.
        const id = window.requestAnimationFrame(() => {
            el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        });
        return () => window.cancelAnimationFrame(id);
    }, [currentPath]);

    return (
        <nav className="space-y-1 font-mono" aria-label="Docs navigation">
            {DOCS_NAV.map((section) => {
                const isActive = activeSection === section.slug;
                const isOpen = isActive || peeked.has(section.slug);
                const panelId = `docs-section-${section.slug}`;
                return (
                    <div key={section.slug} className="border-b border-transparent">
                        <button
                            type="button"
                            onClick={() => toggle(section.slug)}
                            aria-expanded={isOpen}
                            aria-controls={panelId}
                            className={cn(
                                'label-mono group flex w-full items-center gap-2 rounded-none border-l-2 px-2 py-1.5 text-left transition-colors',
                                isActive
                                    ? 'border-primary text-primary'
                                    : 'text-primary/80 hover:text-primary border-transparent'
                            )}
                        >
                            <ChevronRight
                                className={cn(
                                    'h-3 w-3 shrink-0 transition-transform',
                                    isOpen && 'rotate-90'
                                )}
                            />
                            <span>§ {section.label}</span>
                        </button>
                        {isOpen && (
                            <ul id={panelId} className="mb-3 space-y-0 pl-3">
                                {section.items.map((item) => {
                                    const itemActive = currentPath === item.href;
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                ref={itemActive ? activeItemRef : undefined}
                                                onClick={onNavigate}
                                                className={cn(
                                                    'relative block border-l-2 px-3 py-1.5 text-[12.5px] leading-relaxed transition-colors',
                                                    itemActive
                                                        ? 'border-primary text-foreground bg-primary/5 rounded-r-lg font-semibold'
                                                        : 'text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 border-transparent'
                                                )}
                                            >
                                                {itemActive && (
                                                    <span className="text-primary mr-1.5">
                                                        {'>'}
                                                    </span>
                                                )}
                                                {item.label}
                                                {item.badge && (
                                                    <span className="text-primary ml-2 text-[9px] tracking-widest uppercase">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
