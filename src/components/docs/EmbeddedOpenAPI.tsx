/**
 * Inline OpenAPI spec renderer used by the /api-reference/* pages.
 *
 * Each page hands a remote OpenAPI URL (e.g. https://me.ochk.io/api/openapi).
 * We render Swagger UI dynamically — ssr:false + a tall placeholder so the
 * MDX page paints fast and the heavy bundle (~1.5MB) only loads on these
 * three routes, code-split by Next.
 *
 * Why inline instead of "go visit the live explorer":
 *   The MDX pages already explain the surface in prose; the embedded UI
 *   gives readers Try-it-out + per-endpoint deep-link without leaving
 *   ochk.io/docs. The explorer at the product's own /api-explorer is
 *   still the canonical surface (cookie auth flows there); this is a
 *   reading-friendly mirror.
 */

'use client';

import { TextLink } from '@orangecheck/app-design/components';
import dynamic from 'next/dynamic';

import 'swagger-ui-react/swagger-ui.css';
// Swagger UI's dark mode on the shared token names. The classic package stays
// a dependency for this one stylesheet until app-design ships its own.
import '@orangecheck/design/styles/swagger.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
    ssr: false,
    loading: () => (
        <div className="text-muted-foreground flex items-center justify-center px-6 py-20 text-[0.875rem]">
            Loading the OpenAPI reference…
        </div>
    ),
});

interface EmbeddedOpenAPIProps {
    /** Absolute URL to the live OpenAPI 3.1 JSON. CORS-permissive on every product. */
    url: string;
    /** Optional caption — surfaces the live URL above the embed. */
    caption?: string;
}

export function EmbeddedOpenAPI({ url, caption }: EmbeddedOpenAPIProps) {
    return (
        <div className="not-prose border-border bg-card my-8 overflow-hidden rounded-2xl border">
            <div className="border-border text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-5 py-3 text-[0.875rem]">
                <span>OpenAPI 3.1 · live spec</span>
                <TextLink
                    href={url}
                    className="inline-flex min-h-11 items-center font-mono text-[0.8125rem] break-all sm:min-h-0"
                >
                    {url}
                </TextLink>
                {caption && <span>{caption}</span>}
            </div>
            <style>{`
                .swagger-ui .topbar { display: none; }
                .swagger-ui { margin: 0; }
                .swagger-ui .scheme-container { background: transparent; }
            `}</style>
            <SwaggerUI
                url={url}
                deepLinking
                docExpansion="list"
                defaultModelsExpandDepth={0}
                tryItOutEnabled={false}
                persistAuthorization
            />
        </div>
    );
}
