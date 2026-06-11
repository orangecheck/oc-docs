import type { AppProps } from 'next/app';

import { MDXProvider } from '@mdx-js/react';
import { OcSessionProvider } from '@orangecheck/auth-client';
import { LayoutSubHeader, OcThemeBridge, OcThemeProvider } from '@orangecheck/design';
import { useRouter } from 'next/router';

import { DocsLayout } from '@/components/docs/DocsLayout';
import { findDocsMeta } from '@/components/docs/nav';
import { LayoutFooter } from '@/components/layout/LayoutFooter';
import { LayoutHeader } from '@/components/layout/LayoutHeader';
import { useMDXComponents } from '@/components/layout/MdxComponents';
import { Seo } from '@/components/layout/Seo';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
    const components = useMDXComponents({});
    const router = useRouter();
    const pathname = (router.asPath.split('?')[0] ?? '/').split('#')[0] || '/';
    const docsMeta = findDocsMeta(pathname);
    const isRoot = pathname === '/';
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange
        >
            <OcThemeBridge />
            {/* docs is reading-heavy — keep the ambient aurora faint behind long prose */}
            <OcThemeProvider aurora={{ intensity: 0.5 }}>
                <Seo
                    title={docsMeta.title}
                    description={docsMeta.description}
                    canonical={isRoot ? undefined : pathname}
                    ogType={isRoot ? 'website' : 'article'}
                />
                <OcSessionProvider>
                    <MDXProvider components={components}>
                        <LayoutHeader />
                        <LayoutSubHeader
                            product="oc · docs"
                            tags={[{ label: 'specs · api · guides' }]}
                        />
                        <main className="min-h-[calc(100vh-3rem)] py-8">
                            <DocsLayout>
                                <Component {...pageProps} />
                            </DocsLayout>
                        </main>
                        <LayoutFooter />
                    </MDXProvider>
                </OcSessionProvider>
            </OcThemeProvider>
        </ThemeProvider>
    );
}
