import sources from '@/generated/doc-sources.json';

import { SITE_CONFIG } from '@/lib/site.config';

const SOURCES: Record<string, string> = sources;

/**
 * GitHub blob URL for the source file behind a docs route, or null if the
 * route isn't a known page. Built from the generated route → source-file
 * manifest (scripts/gen-doc-sources.mjs) so it's exact for every page,
 * including index pages and the auto-generated /sdk tree.
 */
export function docSourceUrl(pathname: string): string | null {
    const file = SOURCES[pathname];
    if (!file) return null;
    return `https://github.com/${SITE_CONFIG.github}/blob/main/${file}`;
}
