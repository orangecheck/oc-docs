import type { AppProps } from 'next/app';

import { MDXProvider } from '@mdx-js/react';

import { DocsLayout } from '@/components/docs/DocsLayout';
import { LayoutFooter } from '@/components/layout/LayoutFooter';
import { LayoutHeader } from '@/components/layout/LayoutHeader';
import { useMDXComponents } from '@/components/layout/MdxComponents';

import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
    const components = useMDXComponents({});
    return (
        <MDXProvider components={components}>
            <LayoutHeader />
            <main className="min-h-[calc(100vh-3rem)] py-8">
                <DocsLayout>
                    <Component {...pageProps} />
                </DocsLayout>
            </main>
            <LayoutFooter />
        </MDXProvider>
    );
}
