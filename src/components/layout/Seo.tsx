import type { SEOConfig } from '@/lib/seo/seo';

import Head from 'next/head';

import { generateMetaTags } from '@/lib/seo/seo';

interface SEOProps extends SEOConfig {
    structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function Seo(props: SEOProps) {
    const { structuredData, ...config } = props;
    const meta = generateMetaTags(config);
    const ogImage = meta.openGraph.images[0];
    const twitterImage = meta.twitter.images[0];

    return (
        <Head>
            <title key="title">{meta.title}</title>
            <meta key="m-title" name="title" content={meta.title} />
            <meta key="m-description" name="description" content={meta.description} />
            {meta.keywords && <meta key="m-keywords" name="keywords" content={meta.keywords} />}
            <link key="canonical" rel="canonical" href={meta.canonical} />

            <meta key="og:type" property="og:type" content={meta.openGraph.type} />
            <meta key="og:url" property="og:url" content={meta.openGraph.url} />
            <meta key="og:title" property="og:title" content={meta.openGraph.title} />
            <meta
                key="og:description"
                property="og:description"
                content={meta.openGraph.description}
            />
            <meta key="og:site_name" property="og:site_name" content={meta.openGraph.siteName} />
            {ogImage && <meta key="og:image" property="og:image" content={ogImage.url} />}
            {ogImage && <meta key="og:image:type" property="og:image:type" content="image/png" />}
            {ogImage && (
                <meta
                    key="og:image:width"
                    property="og:image:width"
                    content={String(ogImage.width)}
                />
            )}
            {ogImage && (
                <meta
                    key="og:image:height"
                    property="og:image:height"
                    content={String(ogImage.height)}
                />
            )}
            {ogImage && <meta key="og:image:alt" property="og:image:alt" content={ogImage.alt} />}

            <meta key="tw:card" name="twitter:card" content={meta.twitter.card} />
            <meta key="tw:title" name="twitter:title" content={meta.twitter.title} />
            <meta
                key="tw:description"
                name="twitter:description"
                content={meta.twitter.description}
            />
            {twitterImage && <meta key="tw:image" name="twitter:image" content={twitterImage} />}

            <meta
                key="robots"
                name="robots"
                content={`${meta.robots.index ? 'index' : 'noindex'},${meta.robots.follow ? 'follow' : 'nofollow'}`}
            />

            {structuredData && (
                <script
                    key="ld-json"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />
            )}
        </Head>
    );
}
