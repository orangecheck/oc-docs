/**
 * SEO utilities for ochk.io/docs — mirrors ochk.io's shape so tooling and
 * social-card tests work identically.
 */
import { cardTitle } from '@orangecheck/site-kit/seo';

import { SITE_CONFIG } from '@/lib/site.config';

export interface SEOConfig {
    title?: string;
    description?: string;
    /** A path under /docs ('/' is the docs home), or null for a page that names no canonical (404, 500). */
    canonical: string | null;
    ogImage?: string;
    ogType?: 'website' | 'article';
    noindex?: boolean;
    keywords?: string[];
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || SITE_CONFIG.siteUrl;
const SITE_NAME = 'orangecheck docs';
const DEFAULT_TITLE = 'orangecheck documentation';
const DEFAULT_DESCRIPTION =
    'The orangecheck handbook. Six verbs — am, whisper, decide, declare, delegate, swear — mapped to identity, confidentiality, legitimacy, provenance, authority, commitment. Six composable protocols on Bitcoin: OC Attest, OC Lock, OC Vote, OC Stamp, OC Agent, OC Pledge. BIP-322 + Nostr kind-30078 + OpenTimestamps. Every artifact verifies offline, forever.';

/** The docs card with this page's title; the card already shows the site's name. */
const ogCard = (title: string) =>
    `${SITE_URL}/api/og?title=${encodeURIComponent(cardTitle({ name: SITE_NAME }, title))}`;

export function generateMetaTags(config: SEOConfig) {
    const {
        title = DEFAULT_TITLE,
        description = DEFAULT_DESCRIPTION,
        canonical,
        ogImage = ogCard(title),
        ogType = 'website',
        noindex = false,
        keywords = [],
    } = config;

    const fullTitle = title === DEFAULT_TITLE ? title : `${title} — ${SITE_NAME}`;
    // '/' is the docs home itself: /docs/ would redirect to /docs.
    const canonicalUrl =
        canonical === null ? null : canonical === '/' ? SITE_URL : `${SITE_URL}${canonical}`;

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
