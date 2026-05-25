import { getOcThemeInitScript } from '@orangecheck/design';
import { Head, Html, Main, NextScript } from 'next/document';

// Plausible analytics — privacy-first, no cookies, GDPR-clean. Every
// site in the family reports under one Plausible property
// (`data-domain="ochk.io"`); the actual hostname (`docs.ochk.io`,
// `lock.ochk.io`, ...) is captured by Plausible's standard event payload
// so per-subdomain breakdowns are a dashboard filter away. Override the
// site rollup target via NEXT_PUBLIC_PLAUSIBLE_DOMAIN if a deploy needs
// to report somewhere else (e.g. a separate property).
const DOMAIN_RE = /^[a-z0-9][a-z0-9.-]{0,253}$/i;
const SAFE_URL_RE = /^https:\/\/[a-z0-9.-]+(:\d+)?(\/[\w./+%@~,!$&'()*-]*)?$/i;
// First-party proxy paths (rewritten to plausible.io in next.config) are
// what keep the script off ad-blocker blocklists.
const SAFE_PATH_RE = /^\/[\w./-]*$/;
const RAW_PLAUSIBLE_DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ?? 'ochk.io';
const RAW_PLAUSIBLE_SRC = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC ?? '/oc-insights.js';
const RAW_PLAUSIBLE_API = process.env.NEXT_PUBLIC_PLAUSIBLE_API ?? '/oc-insights/event';
const PLAUSIBLE_DOMAIN = DOMAIN_RE.test(RAW_PLAUSIBLE_DOMAIN) ? RAW_PLAUSIBLE_DOMAIN : '';
const isSafeRef = (v: string) => SAFE_URL_RE.test(v) || SAFE_PATH_RE.test(v);
const PLAUSIBLE_SRC = isSafeRef(RAW_PLAUSIBLE_SRC) ? RAW_PLAUSIBLE_SRC : '';
const PLAUSIBLE_API = isSafeRef(RAW_PLAUSIBLE_API) ? RAW_PLAUSIBLE_API : '';
const ANALYTICS_ENABLED =
    process.env.NODE_ENV === 'production' && Boolean(PLAUSIBLE_DOMAIN) && Boolean(PLAUSIBLE_SRC);

export default function Document() {
    return (
        // suppressHydrationWarning: getOcThemeInitScript() + next-themes set the
        // skin/mode class + data-oc-theme on <html> before React hydrates, which
        // is an intentional client/server attribute divergence.
        <Html lang="en" suppressHydrationWarning>
            <Head>
                {/* Favicons · sourced from github.com/orangecheck/oc-media-kit
                    (dist/docs/favicon/*). Regenerate via the kit then
                    `cp ../oc-media-kit/dist/docs/favicon/* public/favicons/`. */}
                <link rel="icon" type="image/svg+xml" href="/favicons/favicon.svg" />
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
                                    if (${JSON.stringify(PLAUSIBLE_API)}) script.dataset.api = ${JSON.stringify(PLAUSIBLE_API)};
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
                {/* No-flash skin + mode init from @orangecheck/design — applies
                    the saved oc_skin / oc_theme before first paint. */}
                <script dangerouslySetInnerHTML={{ __html: getOcThemeInitScript() }} />
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
