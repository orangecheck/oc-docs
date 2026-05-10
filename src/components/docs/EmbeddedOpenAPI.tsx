/**
 * Inline OpenAPI spec renderer used by the /api-reference/* pages.
 *
 * Each page hands a remote OpenAPI URL (e.g. https://fleet.ochk.io/api/openapi).
 * We render Swagger UI dynamically — ssr:false + a tall placeholder so the
 * MDX page paints fast and the heavy bundle (~1.5MB) only loads on these
 * three routes, code-split by Next.
 *
 * Why inline instead of "go visit the live explorer":
 *   The MDX pages already explain the surface in prose; the embedded UI
 *   gives readers Try-it-out + per-endpoint deep-link without leaving
 *   docs.ochk.io. The explorer at the product's own /api-explorer is
 *   still the canonical surface (cookie auth flows there); this is a
 *   reading-friendly mirror.
 */

'use client';

import dynamic from 'next/dynamic';

import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
    ssr: false,
    loading: () => (
        <div className="border-muted-foreground/20 bg-card/40 text-muted-foreground my-6 flex items-center justify-center border px-6 py-20 font-mono text-[12px]">
            loading openapi reference…
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
        <div className="border-muted-foreground/20 bg-background my-8 border">
            <div className="bg-card/40 border-b px-4 py-2 font-mono text-[10.5px] tracking-widest uppercase">
                <span className="text-muted-foreground">openapi 3.1 · live spec</span>
                <span className="text-muted-foreground/60 mx-2">·</span>
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                >
                    {url}
                </a>
                {caption && (
                    <>
                        <span className="text-muted-foreground/60 mx-2">·</span>
                        <span className="text-muted-foreground">{caption}</span>
                    </>
                )}
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
