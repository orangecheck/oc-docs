'use client';

import { Button, Sheet, SheetContent, SheetTitle, SheetTrigger } from '@orangecheck/design';
import { ListTree, Menu } from 'lucide-react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { DocsBreadcrumb } from './DocsBreadcrumb';
import { DocsNav } from './DocsNav';
import { DocsPagination } from './DocsPagination';
import { DocsToc, TocList, useDocsToc } from './DocsToc';
import { findDocsPage } from './nav';

/**
 * Three-column docs shell: left sidebar (nav), center content, right toc.
 * Mobile: content only, nav and toc each in a sheet.
 */
export function DocsLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = router.asPath.split('?')[0]!.split('#')[0]!;
    const page = findDocsPage(pathname);
    const pageLabel = page?.label ?? 'Documentation';
    const toc = useDocsToc();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [tocOpen, setTocOpen] = useState(false);
    useEffect(() => {
        setDrawerOpen(false);
        setTocOpen(false);
    }, [pathname]);

    return (
        <div className="container">
            {/* Mobile bar: site nav on the left, this page's sections on the right */}
            <div className="bg-background/90 sticky top-12 z-30 -mx-4 mb-6 flex items-center justify-between gap-2 border-b px-4 py-1 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:hidden lg:px-8">
                <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                    <SheetTrigger asChild>
                        <Button size="sm" variant="outline" className="h-11 gap-2 font-mono">
                            <Menu className="h-3 w-3" />
                            <span className="text-[11px] tracking-widest uppercase">menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-80 gap-0 p-0">
                        <div className="border-b px-4 py-3 pr-12">
                            <SheetTitle className="label-mono text-primary">§ docs</SheetTitle>
                        </div>
                        <div className="overflow-y-auto p-4">
                            <DocsNav onNavigate={() => setDrawerOpen(false)} />
                        </div>
                    </SheetContent>
                </Sheet>
                {toc.items.length > 1 ? (
                    <Sheet open={tocOpen} onOpenChange={setTocOpen}>
                        <SheetTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-11 gap-2 font-mono">
                                <ListTree className="h-3 w-3" />
                                <span className="text-[11px] tracking-widest uppercase">
                                    on this page
                                </span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-80 gap-0 p-0">
                            <div className="border-b px-4 py-3 pr-12">
                                <SheetTitle className="label-mono text-primary">
                                    § {pageLabel.toLowerCase()}
                                </SheetTitle>
                            </div>
                            <div className="overflow-y-auto p-4 font-mono text-[13px]">
                                <TocList
                                    items={toc.items}
                                    activeId={toc.activeId}
                                    onNavigate={() => setTocOpen(false)}
                                    className="[&_a]:py-2"
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                ) : (
                    <span className="text-muted-foreground truncate font-mono text-[11px]">
                        {pageLabel.toLowerCase()}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)_220px] lg:gap-12">
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
                    <DocsToc items={toc.items} activeId={toc.activeId} />
                </div>
            </div>
        </div>
    );
}
