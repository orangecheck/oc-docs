/**
 * SEO utilities for docs.ochk.io — mirrors ochk.io's shape so tooling and
 * social-card tests work identically.
 */

export interface SEOConfig {
    title?: string;
    description?: string;
    canonical?: string;
    ogImage?: string;
    ogType?: 'website' | 'article';
    noindex?: boolean;
    keywords?: string[];
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://docs.ochk.io';
const SITE_NAME = 'OrangeCheck docs';
const DEFAULT_TITLE = 'OrangeCheck documentation';
const DEFAULT_DESCRIPTION =
    'The OrangeCheck handbook. Six verbs — am, whisper, decide, declare, delegate, swear — mapped to identity, confidentiality, legitimacy, provenance, authority, commitment. Six composable protocols on Bitcoin: OC Attest, OC Lock, OC Vote, OC Stamp, OC Agent, OC Pledge. BIP-322 + Nostr kind-30078 + OpenTimestamps. Every artifact verifies offline, forever.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/api/og`;

export function generateMetaTags(config: SEOConfig = {}) {
    const {
        title = DEFAULT_TITLE,
        description = DEFAULT_DESCRIPTION,
        canonical,
        ogImage = DEFAULT_OG_IMAGE,
        ogType = 'website',
        noindex = false,
        keywords = [],
    } = config;

    const fullTitle = title === DEFAULT_TITLE ? title : `${title} — ${SITE_NAME}`;
    const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL;

    return {
        title: fullTitle,
        description,
        canonical: canonicalUrl,
        openGraph: {
            type: ogType,
            url: canonicalUrl,
            title: fullTitle,
            description,
            siteName: SITE_NAME,
            images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
        },
        twitter: {
            card: 'summary_large_image',
            title: fullTitle,
            description,
            images: [ogImage],
        },
        robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
        keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    };
}

export function generateStructuredData(
    type: 'Organization' | 'WebSite' | 'WebPage',
    data?: Record<string, unknown>
): Record<string, unknown> {
    const baseUrl = SITE_URL;

    if (type === 'Organization') {
        return {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'OrangeCheck',
            url: 'https://ochk.io',
            logo: 'https://ochk.io/favicon.png',
            description: DEFAULT_DESCRIPTION,
        };
    }

    if (type === 'WebSite') {
        return {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: SITE_NAME,
            url: baseUrl,
            description: DEFAULT_DESCRIPTION,
        };
    }

    return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: (data?.title as string) ?? DEFAULT_TITLE,
        description: (data?.description as string) ?? DEFAULT_DESCRIPTION,
        url: (data?.url as string) ?? baseUrl,
        ...(data ?? {}),
    };
}

export const SEO_DEFAULTS = {
    SITE_URL,
    SITE_NAME,
    DEFAULT_TITLE,
    DEFAULT_DESCRIPTION,
    DEFAULT_OG_IMAGE,
};
