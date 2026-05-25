'use client';

import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Button, Sheet, SheetContent, SheetTrigger } from '@orangecheck/design';

import { DocsBreadcrumb } from './DocsBreadcrumb';
import { DocsNav } from './DocsNav';
import { DocsPagination } from './DocsPagination';
import { DocsToc } from './DocsToc';
import { findDocsPage } from './nav';

/**
 * Three-column docs shell: left sidebar (nav), center content, right toc.
 * Mobile: content only, nav in a drawer.
 */
export function DocsLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = router.asPath.split('?')[0]!.split('#')[0]!;
    const page = findDocsPage(pathname);
    const pageLabel = page?.label ?? 'Documentation';

    const [drawerOpen, setDrawerOpen] = useState(false);
    useEffect(() => {
        setDrawerOpen(false);
    }, [pathname]);

    return (
        <div className="container">
            {/* Mobile sidebar trigger */}
            <div className="bg-background/90 sticky top-12 z-30 -mx-4 mb-6 flex items-center justify-between gap-2 border-b px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:hidden lg:px-8">
                <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                    <SheetTrigger asChild>
                        <Button size="sm" variant="outline" className="gap-2 font-mono">
                            <Menu className="h-3 w-3" />
                            <span className="text-[11px] tracking-widest uppercase">menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 p-0">
                        <div className="flex items-center justify-between border-b px-4 py-3">
                            <span className="label-mono text-primary">§ docs</span>
                            <button
                                onClick={() => setDrawerOpen(false)}
                                aria-label="Close"
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4">
                            <DocsNav onNavigate={() => setDrawerOpen(false)} />
                        </div>
                    </SheetContent>
                </Sheet>
                <span className="text-muted-foreground truncate font-mono text-[11px]">
                    docs / <span className="text-foreground">{pageLabel.toLowerCase()}</span>
                </span>
            </div>

            <div className="grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)_220px] lg:gap-12">
                <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] overflow-y-auto pr-2 lg:block">
                    <DocsNav />
                </aside>

                <article className="min-w-0 pb-12">
                    <DocsBreadcrumb pathname={pathname} />
                    <div id="docs-content" className="docs-prose">
                        {children}
                    </div>
                    <DocsPagination pathname={pathname} />
                </article>

                <div className="hidden lg:block">
                    <DocsToc />
                </div>
            </div>
        </div>
    );
}
