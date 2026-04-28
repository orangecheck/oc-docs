import type { NextConfig } from 'next';

import createMDX from '@next/mdx';
import rehypeSlug from 'rehype-slug';

const nextConfig: NextConfig = {
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],

    // @orangecheck/ui ships an ESM bundle with `import 'next/link'`; without
    // transpile next's bare-specifier resolution fails (no exports map).
    transpilePackages: ['@orangecheck/ui'],

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
                            "connect-src 'self' https://ochk.io https://attest.ochk.io",
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
