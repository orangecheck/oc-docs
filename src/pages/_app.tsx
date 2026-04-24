import type { AppProps } from 'next/app';

import { MDXProvider } from '@mdx-js/react';
import { OcSessionProvider } from '@orangecheck/auth-client';

import { DocsLayout } from '@/components/docs/DocsLayout';
import { LayoutFooter } from '@/components/layout/LayoutFooter';
import { LayoutHeader } from '@/components/layout/LayoutHeader';
import { LayoutSubHeader } from '@/components/layout/LayoutSubHeader';
import { useMDXComponents } from '@/components/layout/MdxComponents';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
    const components = useMDXComponents({});
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
        >
            <OcSessionProvider>
                <MDXProvider components={components}>
                    <LayoutHeader />
                    <LayoutSubHeader />
                    <main className="min-h-[calc(100vh-3rem)] py-8">
                        <DocsLayout>
                            <Component {...pageProps} />
                        </DocsLayout>
                    </main>
                    <LayoutFooter />
                </MDXProvider>
            </OcSessionProvider>
        </ThemeProvider>
    );
}
