import { FontPreloads } from '@orangecheck/app-design/fonts';
import { FamilyAnalytics } from '@orangecheck/site-kit/analytics';
import { Head, Html, Main, NextScript } from 'next/document';

import { SITE_CONFIG } from '@/lib/site.config';

// Raw paths in this file do not get basePath, so it is added by hand here
// and on the favicons. Analytics post to the first-party proxy under it.
const BASE = SITE_CONFIG.basePath;
const PLAUSIBLE_API = process.env.NEXT_PUBLIC_PLAUSIBLE_API ?? `${BASE}/oc-insights/event`;

export default function Document() {
    return (
        // data-oc-app scopes every token and base rule of @orangecheck/app-design.
        // suppressHydrationWarning: next-themes sets the mode class before React hydrates.
        <Html lang="en" data-oc-app="ochk" suppressHydrationWarning>
            <Head>
                {/* Inter, and the code face every docs page opens on, requested before
                    the stylesheet names them; base path and all. */}
                <FontPreloads mono />
                {/* Favicons · the orangecheck mark's tile, as on ochk.io, from
                    @orangecheck/mark (assets/favicon/*, copied into public/favicons/).
                    /docs/favicons/* is cached as immutable, so a new set bumps ?v=. */}
                <link rel="icon" type="image/svg+xml" href={`${BASE}/favicons/favicon.svg?v=2`} />
                <link rel="icon" type="image/x-icon" href={`${BASE}/favicons/favicon.ico?v=2`} />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="16x16"
                    href={`${BASE}/favicons/favicon-16x16.png?v=2`}
                />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="32x32"
                    href={`${BASE}/favicons/favicon-32x32.png?v=2`}
                />
                <link
                    rel="apple-touch-icon"
                    sizes="180x180"
                    href={`${BASE}/favicons/apple-touch-icon.png?v=2`}
                />
                <link rel="manifest" href={`${BASE}/favicons/site.webmanifest?v=2`} />
                <meta name="application-name" content="orangecheck docs" />
                <meta name="theme-color" media="(prefers-color-scheme: light)" content="#fafafa" />
                <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a" />
                <meta name="color-scheme" content="light dark" />

                {/* Plausible, each page reported as origin and path only. The docs
                    never loaded oc-pulse, and still don't. */}
                <FamilyAnalytics api={PLAUSIBLE_API} pulseSrc="" />
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
