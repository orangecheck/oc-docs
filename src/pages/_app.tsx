import type { TocItem } from '@orangecheck/app-design/components';
import type { NextPage } from 'next';
import type { AppProps } from 'next/app';

import { MDXProvider } from '@mdx-js/react';
import { TooltipProvider } from '@orangecheck/app-design/primitives';
import { OcSessionProvider } from '@orangecheck/auth-client';
import { useFamilyPageviews } from '@orangecheck/site-kit/analytics';
import { ThemeProvider } from 'next-themes';

import { DocsFrame } from '@/components/docs/DocsFrame';
import { docsMdxComponents } from '@/components/docs/mdx';
import { findDocsMeta } from '@/components/docs/nav';
import { Seo } from '@/components/layout/Seo';

import '@/styles/globals.css';

/**
 * A page outside the docs' sections (404, 500) sets `bare`. An MDX page
 * carries its "On this page" list as `toc` (src/lib/mdx-toc.mjs).
 */
type DocsPage = NextPage & { bare?: boolean; toc?: TocItem[] };

export default function App({ Component, pageProps, router }: AppProps) {
    // One pageview per page, reported as origin and path only.
    useFamilyPageviews();
    const path = (router.asPath.split(/[?#]/)[0] ?? '/') || '/';
    const docsMeta = findDocsMeta(path);
    const isRoot = path === '/';
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <Seo
                title={docsMeta.title}
                description={docsMeta.description}
                canonical={(Component as DocsPage).bare ? null : path}
                ogType={isRoot ? 'website' : 'article'}
            />
            <OcSessionProvider>
                <TooltipProvider delayDuration={200}>
                    <MDXProvider components={docsMdxComponents}>
                        <DocsFrame
                            path={path}
                            bare={(Component as DocsPage).bare}
                            toc={(Component as DocsPage).toc}
                        >
                            <Component {...pageProps} />
                        </DocsFrame>
                    </MDXProvider>
                </TooltipProvider>
            </OcSessionProvider>
        </ThemeProvider>
    );
}
