'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';

import { cn } from '@/lib/utils/utils';

import { DOCS_NAV } from './nav';

export function DocsNav({ onNavigate }: { onNavigate?: () => void }) {
    const router = useRouter();
    const currentPath = router.asPath.split('?')[0]!.split('#')[0]!;

    return (
        <nav className="space-y-6 font-mono">
            {DOCS_NAV.map((section) => (
                <div key={section.slug}>
                    <div className="label-mono text-primary mb-2 px-2">§ {section.label}</div>
                    <ul className="space-y-0">
                        {section.items.map((item) => {
                            const isActive = currentPath === item.href;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={onNavigate}
                                        className={cn(
                                            'relative block border-l-2 px-3 py-1.5 text-[12.5px] leading-relaxed transition-colors',
                                            isActive
                                                ? 'border-primary text-foreground bg-primary/5 font-semibold'
                                                : 'text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 border-transparent'
                                        )}
                                    >
                                        {isActive && (
                                            <span className="text-primary mr-1.5">{'>'}</span>
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
                </div>
            ))}
        </nav>
    );
}
