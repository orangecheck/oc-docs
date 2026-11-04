import type { DocsNavSection, DocsShellProps } from '@orangecheck/app-design/chrome';
import type { Crumb, PagerLink, TocItem } from '@orangecheck/app-design/components';
import type { ReactNode } from 'react';

import {
    DOCS_HEADER_NAV,
    DocsShell,
    OCHK_APP_ACCOUNT,
    OchkIoFooter,
    SiteHeader,
    SkipLink,
} from '@orangecheck/app-design/chrome';
import { Breadcrumbs, DocsPager, TextLink } from '@orangecheck/app-design/components';
import { GET_AN_ACCOUNT, OCHK_IO } from '@orangecheck/app-design/family';
import { SessionAccount } from '@orangecheck/app-design/session';
import { useOptionalOcSession } from '@orangecheck/auth-client';

import { DocsSearch } from '@/components/docs/DocsSearch';
import { DOCS_NAV, findDocsPage, findSectionFor, prevNextFor } from '@/components/docs/nav';
import { docSourceUrl } from '@/components/docs/sources';

const NAV: DocsNavSection[] = DOCS_NAV.map((s) => ({
    label: s.label,
    items: s.items.map((i) => ({ href: i.href, label: i.label, badge: i.badge })),
}));

/** Docs › section › page; a generated SDK page sits under its package. */
function crumbsFor(path: string): Crumb[] | null {
    if (path === '/') return null;
    const root: Crumb = { href: '/', label: 'Docs' };
    const page = findDocsPage(path);
    const section = findSectionFor(path);
    if (page && section) {
        const first = section.items[0]!;
        // A section's first page is the section: "Docs › OC Attest", not "› Overview".
        return first.href === page.href
            ? [root, { label: section.label }]
            : [root, { href: first.href, label: section.label }, { label: page.label }];
    }
    const sdk = path.match(/^\/sdk\/([^/]+)\/(.+)$/);
    if (sdk) {
        return [
            root,
            { href: '/sdk', label: 'SDKs' },
            { href: `/sdk/${sdk[1]}/README`, label: `@orangecheck/${sdk[1]}` },
            { label: sdk[2]!.split('/').pop()! },
        ];
    }
    return [root, { label: path.split('/').pop()! }];
}

/** A deep SDK page has no item of its own: its package's README opens the SDKs. */
function navItemFor(path: string): string | undefined {
    if (findDocsPage(path)) return undefined;
    const pkg = path.match(/^\/sdk\/([^/]+)\/.+$/)?.[1];
    const readme = pkg ? `/sdk/${pkg}/README` : undefined;
    return readme && findDocsPage(readme) ? readme : undefined;
}

function pagerFor(path: string): { prev?: PagerLink; next?: PagerLink } {
    const { prev, next } = prevNextFor(path);
    const here = findSectionFor(path)?.label;
    const link = (p: NonNullable<typeof prev>): PagerLink => ({
        href: p.href,
        label: p.label,
        section: p.section !== here ? p.section : undefined,
    });
    return { prev: prev ? link(prev) : undefined, next: next ? link(next) : undefined };
}

const search = <DocsSearch />;

/** The label the signed-in CTA carries; the signed-out one is the family's GET_AN_ACCOUNT. */
const YOUR_ACCOUNT = 'Your account';

/**
 * The header's account parts, as on ochk.io. Signed out: "Sign in" and the deep "Get an account" CTA,
 * both to ochk.io's sign-in, which returns to this page. Signed in: the CTA goes to the account on
 * ochk.app and the menu beside it signs out. The CTA reserves the other label, so the bar keeps one
 * width whichever way the session check answers.
 */
function useHeaderAccount(): Pick<DocsShellProps, 'cta' | 'signIn' | 'actions'> {
    const status = useOptionalOcSession()?.status ?? 'anonymous';
    if (status === 'authenticated') {
        return {
            cta: { label: YOUR_ACCOUNT, href: OCHK_APP_ACCOUNT, reserve: [GET_AN_ACCOUNT.label] },
            signIn: false,
            actions: <SessionAccount />,
        };
    }
    // Sign in only once the check says signed out: while it runs, nothing in the bar links.
    return {
        cta: { pending: status === 'loading', reserve: [YOUR_ACCOUNT] },
        signIn: status === 'anonymous',
    };
}

/**
 * The docs in ochk.io's frame: its header with Docs marked, the sections on
 * the left, the page, what is on it on the right, ochk.io's footer. `bare`
 * pages (404, 500) take the header and footer without the sections.
 */
export function DocsFrame({
    path,
    bare = false,
    toc,
    children,
}: {
    /** The page's path, without the base path, query or hash. */
    path: string;
    bare?: boolean;
    /** Built with the page, so the list is in the first paint; without it DocsShell reads the headings. */
    toc?: TocItem[];
    children: ReactNode;
}) {
    const account = useHeaderAccount();
    if (bare) {
        return (
            <div className="bg-background flex min-h-dvh flex-col">
                <SkipLink />
                <SiteHeader
                    home={OCHK_IO}
                    family="docs"
                    nav={DOCS_HEADER_NAV}
                    search={search}
                    {...account}
                />
                <main id="main-content" className="flex-1">
                    {children}
                </main>
                <OchkIoFooter />
            </div>
        );
    }
    const crumbs = crumbsFor(path);
    const source = docSourceUrl(path);
    const { prev, next } = pagerFor(path);
    return (
        <DocsShell
            nav={NAV}
            current={path}
            navCurrent={navItemFor(path)}
            search={search}
            {...account}
            breadcrumbs={
                crumbs ? (
                    <Breadcrumbs
                        items={crumbs}
                        action={source ? <TextLink href={source}>View source</TextLink> : null}
                    />
                ) : null
            }
            toc={toc}
            pager={<DocsPager prev={prev} next={next} />}
        >
            {children}
        </DocsShell>
    );
}
