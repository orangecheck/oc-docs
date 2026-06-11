'use client';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils/utils';

interface TocItem {
    id: string;
    text: string;
    level: 2 | 3;
}

function collectHeadings(): TocItem[] {
    if (typeof document === 'undefined') return [];
    const main = document.getElementById('docs-content');
    if (!main) return [];
    const nodes = main.querySelectorAll<HTMLHeadingElement>('h2, h3');
    return Array.from(nodes).map((el) => {
        if (!el.id) {
            const slug = (el.textContent ?? '')
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            if (slug) el.id = slug;
        }
        return {
            id: el.id,
            text: el.textContent ?? '',
            level: (el.tagName === 'H2' ? 2 : 3) as 2 | 3,
        };
    });
}

export function DocsToc() {
    const router = useRouter();
    // Strip the hash so clicking an in-page anchor doesn't re-collect.
    const path = router.asPath.split('#')[0] ?? '';
    const [items, setItems] = useState<TocItem[]>([]);
    const [activeId, setActiveId] = useState<string>('');

    // Re-collect headings on EVERY route change. DocsToc is mounted once inside
    // DocsLayout (which is mounted once in _app), so an empty-deps effect froze
    // the list on the first page visited — every client-side navigation then
    // showed the wrong page's headings. Keying on `path` (and resetting first)
    // rebuilds the list for the page actually on screen. By the time this effect
    // runs the new page's DOM has committed; a rAF adds a safety margin for any
    // late layout before we read #docs-content.
    useEffect(() => {
        setActiveId('');
        let raf = 0;
        const run = () => setItems(collectHeadings());
        raf = requestAnimationFrame(run);
        // Belt-and-suspenders for content that settles a tick later.
        const t = setTimeout(run, 60);
        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(t);
        };
    }, [path]);

    useEffect(() => {
        if (items.length === 0) return;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible[0]) setActiveId(visible[0].target.id);
            },
            { rootMargin: '-10% 0% -70% 0%', threshold: 0 }
        );
        items.forEach((i) => {
            const el = document.getElementById(i.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [items]);

    if (items.length === 0) return null;

    return (
        <aside className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto font-mono text-[11.5px]">
            <div className="label-mono text-primary mb-3">§ on this page</div>
            <ul className="space-y-0.5">
                {items.map((i) => (
                    <li key={i.id}>
                        <a
                            href={`#${i.id}`}
                            className={cn(
                                'block border-l-2 py-1 leading-relaxed transition-colors',
                                i.level === 3 ? 'pl-6' : 'pl-3',
                                activeId === i.id
                                    ? 'border-primary text-foreground'
                                    : 'text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 border-transparent'
                            )}
                        >
                            {i.text}
                        </a>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
