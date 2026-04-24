'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/utils/utils';

import { DOCS_NAV } from './nav';

const STORAGE_KEY = 'oc.docs.openSections';

/**
 * Sidebar with collapsible per-section groups. The section the user is
 * currently inside is auto-opened; the rest remember their state across
 * navigations via localStorage. `getting-started` and `ecosystem` are
 * pinned open by default because they're the shared surface every
 * protocol reader needs glance-access to.
 */
function loadOpenSections(): Set<string> {
    const defaults = new Set<string>(['getting-started', 'ecosystem']);
    if (typeof window === 'undefined') return defaults;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaults;
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
            return new Set(parsed.filter((x): x is string => typeof x === 'string'));
        }
    } catch {
        // corrupt value — ignore, fall through to defaults
    }
    return defaults;
}

function currentSectionSlug(currentPath: string): string | null {
    const normalized = currentPath.replace(/\/$/, '') || '/';
    const hit = DOCS_NAV.find((s) => s.items.some((i) => i.href === normalized));
    return hit?.slug ?? null;
}

export function DocsNav({ onNavigate }: { onNavigate?: () => void }) {
    const router = useRouter();
    const currentPath = router.asPath.split('?')[0]!.split('#')[0]!;
    const activeSection = useMemo(() => currentSectionSlug(currentPath), [currentPath]);

    const [open, setOpen] = useState<Set<string>>(() => loadOpenSections());

    // Auto-expand the section the user is inside whenever the route changes.
    useEffect(() => {
        if (!activeSection) return;
        setOpen((prev) => {
            if (prev.has(activeSection)) return prev;
            const next = new Set(prev);
            next.add(activeSection);
            return next;
        });
    }, [activeSection]);

    // Persist across navigations.
    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...open]));
        } catch {
            // quota, disabled storage — non-fatal
        }
    }, [open]);

    const toggle = (slug: string) => {
        setOpen((prev) => {
            const next = new Set(prev);
            if (next.has(slug)) next.delete(slug);
            else next.add(slug);
            return next;
        });
    };

    return (
        <nav className="space-y-1 font-mono" aria-label="Docs navigation">
            {DOCS_NAV.map((section) => {
                const isOpen = open.has(section.slug);
                const isActive = activeSection === section.slug;
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
                                                onClick={onNavigate}
                                                className={cn(
                                                    'relative block border-l-2 px-3 py-1.5 text-[12.5px] leading-relaxed transition-colors',
                                                    itemActive
                                                        ? 'border-primary text-foreground bg-primary/5 font-semibold'
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
