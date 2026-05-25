import type { NextConfig } from 'next';

import createMDX from '@next/mdx';
import rehypeSlug from 'rehype-slug';

// Surface the running build in the OcAccountMenu BuildFooter.
// VERCEL_GIT_COMMIT_SHA is populated automatically on every Vercel deploy;
// `dev` is the safe sentinel for local builds.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('./package.json') as { version: string };
const BUILD_SHA = (process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev').slice(0, 7);

const nextConfig: NextConfig = {
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],

    // @orangecheck/ui ships an ESM bundle with `import 'next/link'`; without
    // transpile next's bare-specifier resolution fails (no exports map).
    transpilePackages: ['@orangecheck/ui'],

    env: {
        NEXT_PUBLIC_APP_VERSION: pkg.version,
        NEXT_PUBLIC_BUILD_SHA: BUILD_SHA,
    },

    /**
     * The handwritten `/sdks/*` group merged into the auto-gen `/sdk/*`
     * tree on 2026-05-09. Permanent 308 redirects so external bookmarks +
     * the existing /sdks/javascript / gate / cli / etc. URLs land at the
     * canonical reference. Everything that wasn't covered by the autogen
     * (Python SDK, error codes) moved to a sensible new home and gets its
     * own redirect.
     */
    async redirects() {
        return [
            { source: '/sdks', destination: '/sdk', permanent: true },
            {
                source: '/sdks/javascript',
                destination: '/sdk/sdk/README',
                permanent: true,
            },
            {
                source: '/sdks/gate',
                destination: '/sdk/gate/README',
                permanent: true,
            },
            {
                source: '/sdks/react',
                destination: '/sdk/react/README',
                permanent: true,
            },
            {
                source: '/sdks/wallet-adapter',
                destination: '/sdk/wallet-adapter/README',
                permanent: true,
            },
            {
                source: '/sdks/cli',
                destination: '/sdk/cli',
                permanent: true,
            },
            {
                source: '/sdks/python',
                destination: '/sdk/python',
                permanent: true,
            },
            {
                source: '/sdks/error-codes',
                destination: '/reference/error-codes',
                permanent: true,
            },
        ];
    },

    async rewrites() {
        return [
            // Plausible proxied first-party (paths mirror the
            // NEXT_PUBLIC_PLAUSIBLE_SRC / _API defaults in _document.tsx).
            // Loading same-origin keeps the script + events off ad-blocker
            // blocklists, which is what threw ERR_BLOCKED_BY_CLIENT.
            {
                source: '/oc-insights.js',
                destination:
                    'https://plausible.io/js/script.hash.outbound-links.pageview-props.tagged-events.js',
            },
            { source: '/oc-insights/event', destination: 'https://plausible.io/api/event' },
        ];
    },

    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains; preload',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline'",
                            "style-src 'self' 'unsafe-inline'",
                            "img-src 'self' data: https:",
                            "font-src 'self' data:",
                            "connect-src 'self' https://ochk.io https://attest.ochk.io https://fleet.ochk.io",
                            "frame-ancestors 'none'",
                            "base-uri 'self'",
                            "form-action 'self'",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

const withMDX = createMDX({
    options: {
        remarkPlugins: [['remark-gfm']],
        // rehype-slug bakes `id="…"` onto every heading at build time so
        // anchor links (DocsToc + direct deep links like /foo#bar) work
        // immediately, with no client-side race against collectHeadings().
        rehypePlugins: [rehypeSlug],
    },
});

export default withMDX(nextConfig);
