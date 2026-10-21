import type { NextConfig } from 'next';

import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

import createMDX from '@next/mdx';
import { rehypeCode } from '@orangecheck/app-design/code';
import rehypeSlug from 'rehype-slug';

import { MOVED_PAGES } from './src/lib/moved-pages';
import rehypeKeepIds from './src/lib/rehype-keep-ids.mjs';
import rehypeTypedoc from './src/lib/rehype-typedoc.mjs';
import { SITE_CONFIG } from './src/lib/site.config';

const isDev = process.env.NODE_ENV !== 'production';

// The old host. Every address on it moves to the same path under ochk.io/docs.
const OLD_HOST = [{ type: 'host' as const, value: 'docs.ochk.io' }];

// Every package README on npm links /sdk/<pkg>; the generated reference starts at /sdk/<pkg>/README.
const SDK_PACKAGES = readdirSync('src/pages/sdk', { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(`src/pages/sdk/${d.name}/README.mdx`))
    .map((d) => d.name);

// webpack's build cache keys a compiled page on its own source, so a page that
// did not change kept what an older MDX plugin made of it: app-design 1.4's
// exact-copy marker reached no unchanged page on Vercel. The cache's version
// carries the plugins', so a new plugin recompiles every page.
const MDX_PLUGINS = createHash('sha256')
    .update(
        [
            'node_modules/@orangecheck/app-design/package.json',
            'node_modules/rehype-slug/package.json',
            'node_modules/remark-gfm/package.json',
            'src/lib/rehype-keep-ids.mjs',
            'src/lib/rehype-typedoc.mjs',
        ]
            .map((f) => readFileSync(f, 'utf8'))
            .join('\0')
    )
    .digest('hex')
    .slice(0, 16);

const nextConfig: NextConfig = {
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],

    basePath: SITE_CONFIG.basePath,

    // Bundle app-design rather than load it from node_modules at render time.
    // Its links come from next/link, and next/link learns the base path only
    // when it is compiled into the build: left external, every link in the
    // header, sidebar and pages renders without /docs.
    transpilePackages: ['@orangecheck/app-design'],

    webpack(config) {
        if (config.cache && typeof config.cache === 'object') {
            config.cache.version = `${config.cache.version ?? ''}|mdx-${MDX_PLUGINS}`;
        }
        return config;
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
            // docs.ochk.io → ochk.io/docs, one hop, query kept. basePath:false
            // matches the old host's paths as they arrive (no /docs prefix).
            // The root has its own rule so it lands on /docs, not /docs/.
            // security.txt belongs at the host root, so it goes to ochk.io's.
            {
                source: '/.well-known/security.txt',
                has: OLD_HOST,
                destination: 'https://ochk.io/.well-known/security.txt',
                basePath: false,
                permanent: true,
            },
            {
                source: '/',
                has: OLD_HOST,
                destination: SITE_CONFIG.siteUrl,
                basePath: false,
                permanent: true,
            },
            {
                source: '/:path+',
                has: OLD_HOST,
                destination: `${SITE_CONFIG.siteUrl}/:path+`,
                basePath: false,
                permanent: true,
            },
            // Pages that are gone, sent where their content lives now.
            ...Object.entries(MOVED_PAGES).map(([source, destination]) => ({
                source,
                destination,
                permanent: true,
            })),
            ...SDK_PACKAGES.map((pkg) => ({
                source: `/sdk/${pkg}`,
                destination: `/sdk/${pkg}/README`,
                permanent: true,
            })),
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
            // NEXT_PUBLIC_PLAUSIBLE_SRC / _API defaults in _document.tsx;
            // basePath applies, so they answer under /docs).
            // Loading same-origin keeps the script + events off ad-blocker
            // blocklists, which is what threw ERR_BLOCKED_BY_CLIENT.
            {
                source: '/oc-insights.js',
                destination:
                    'https://plausible.io/js/script.outbound-links.pageview-props.tagged-events.js',
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
                            // Next dev (react-refresh / HMR) evaluates code via
                            // eval and talks to the dev server over a websocket;
                            // production stays strict (no 'unsafe-eval', no ws:).
                            isDev
                                ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
                                : "script-src 'self' 'unsafe-inline'",
                            "style-src 'self' 'unsafe-inline'",
                            "img-src 'self' data: https:",
                            "font-src 'self' data:",
                            isDev
                                ? "connect-src 'self' ws: https://ochk.io https://attest.ochk.io"
                                : "connect-src 'self' https://ochk.io https://attest.ochk.io",
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
    // Compile MDX to read its component mapping from the nearest
    // <MDXProvider> (mounted in _app via useMDXComponents). Without this the
    // mapping is applied inconsistently between SSR (raw <h1>/<p>/<table>) and
    // the client (styled components), which React flags as a hydration
    // mismatch (#418) on any MDX *page* — e.g. the homepage index.mdx. With it,
    // server and client both render the styled components.
    options: {
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [['remark-gfm']],
        // rehype-slug bakes `id="…"` onto every heading at build time so
        // anchor links ("On this page" + direct deep links like /foo#bar) work
        // immediately. rehype-keep-ids keeps BIP-322, kind-30085 and the like
        // on one line. rehype-typedoc reads TypeDoc's escapes in /sdk after the
        // ids are set, so no anchor moves. rehypeCode highlights every fence.
        rehypePlugins: [rehypeSlug, rehypeKeepIds, rehypeTypedoc, rehypeCode],
    },
});

export default withMDX(nextConfig);
