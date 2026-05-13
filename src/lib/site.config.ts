import type { EcosystemSlug, OcAccountMenuItem, SiteState } from '@orangecheck/ui';

/**
 * Single source of truth for this site's identity. Read by the header
 * logo, the account dropdown, the build-footer, and anywhere else
 * needing a self-consistent label. Edit here once → every surface
 * updates on the next build.
 */
export const SITE_CONFIG = {
    slug: 'docs' satisfies EcosystemSlug,
    hostname: 'docs.ochk.io',
    state: 'live' satisfies SiteState,
    github: 'orangecheck/oc-docs',
    accountMenuItems: [] satisfies ReadonlyArray<OcAccountMenuItem>,
} as const;
