import type { AppProps } from 'next/app';

import { MDXProvider } from '@mdx-js/react';
import { OcSessionProvider } from '@orangecheck/auth-client';
import { LayoutSubHeader, OcThemeBridge, OcThemeProvider } from '@orangecheck/design';

import { DocsLayout } from '@/components/docs/DocsLayout';
import { LayoutFooter } from '@/components/layout/LayoutFooter';
import { LayoutHeader } from '@/components/layout/LayoutHeader';
import { useMDXComponents } from '@/components/layout/MdxComponents';
import { Seo } from '@/components/layout/Seo';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
    const components = useMDXComponents({});
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
            disableTransitionOnChange
        >
            <OcThemeBridge />
            <OcThemeProvider>
                <Seo />
                <OcSessionProvider>
                    <MDXProvider components={components}>
                        <LayoutHeader />
                        <LayoutSubHeader
                            product="oc · docs"
                            tags={[
                                { label: 'specs · api · guides' },
                                { label: 'cc-by-4.0', hideBelow: 'sm' },
                                { label: 'every artifact verifies offline', hideBelow: 'md' },
                            ]}
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
