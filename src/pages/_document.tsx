import { Head, Html, Main, NextScript } from 'next/document';

// Plausible analytics — privacy-first, no cookies, GDPR-clean. Override by
// setting NEXT_PUBLIC_PLAUSIBLE_DOMAIN in the deploy env.
const DOMAIN_RE = /^[a-z0-9][a-z0-9.-]{0,253}$/i;
const SAFE_URL_RE = /^https:\/\/[a-z0-9.-]+(:\d+)?(\/[\w./+%@~,!$&'()*-]*)?$/i;
const RAW_PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? 'docs.ochk.io';
const RAW_PLAUSIBLE_SRC =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ??
    'https://plausible.io/js/script.hash.outbound-links.pageview-props.tagged-events.js';
const PLAUSIBLE_DOMAIN = DOMAIN_RE.test(RAW_PLAUSIBLE_DOMAIN) ? RAW_PLAUSIBLE_DOMAIN : '';
const PLAUSIBLE_SRC = SAFE_URL_RE.test(RAW_PLAUSIBLE_SRC) ? RAW_PLAUSIBLE_SRC : '';
const ANALYTICS_ENABLED =
    process.env.NODE_ENV === 'production' && Boolean(PLAUSIBLE_DOMAIN) && Boolean(PLAUSIBLE_SRC);

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <link rel="icon" type="image/x-icon" href="/favicons/favicon.ico" />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="16x16"
                    href="/favicons/favicon-16x16.png"
                />
                <link
                    rel="icon"
                    type="image/png"
                    sizes="32x32"
                    href="/favicons/favicon-32x32.png"
                />
                <link
                    rel="apple-touch-icon"
                    sizes="180x180"
                    href="/favicons/apple-touch-icon.png"
                />
                <link rel="manifest" href="/favicons/site.webmanifest" />
                <meta name="application-name" content="OrangeCheck docs" />
                <meta name="theme-color" content="#f97316" />
                <meta name="color-scheme" content="dark light" />

                {ANALYTICS_ENABLED && (
                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
                                window.plausible = window.plausible || function() {
                                    (window.plausible.q = window.plausible.q || []).push(arguments)
                                };
                                (function() {
                                    var script = document.createElement('script');
                                    script.defer = true;
                                    script.dataset.domain = ${JSON.stringify(PLAUSIBLE_DOMAIN)};
                                    script.src = ${JSON.stringify(PLAUSIBLE_SRC)};
                                    script.onerror = function() {};
                                    document.head.appendChild(script);
                                })();
                            `,
                        }}
                    />
                )}
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
