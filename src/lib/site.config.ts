/**
 * Single source of truth for this site's identity: where it is served and
 * where its source lives. Edit here once and every surface follows.
 */
export const SITE_CONFIG = {
    hostname: 'ochk.io',
    // Served at ochk.io/docs: ochk.io rewrites /docs/* to this deployment.
    basePath: '/docs',
    siteUrl: 'https://ochk.io/docs',
    github: 'orangecheck/oc-docs',
} as const;
