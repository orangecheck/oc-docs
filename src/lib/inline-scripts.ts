import { logoScript } from '@orangecheck/app-design/brand';
import { familyAnalyticsScripts } from '@orangecheck/site-kit/analytics';

import { SITE_CONFIG } from './site.config';

/*
 * Every inline script _document's head runs, as the page carries it. script-src
 * lists each by hash (next.config) in place of 'unsafe-inline', with the theme
 * script app-design's ThemeProvider writes in _app. next.config loads this, so
 * imports here are packages or relative paths, never '@/'.
 */

/** FamilyAnalytics' props: Plausible posts to the first-party proxy under the base path; no oc-pulse. */
export const ANALYTICS = {
    api: process.env.NEXT_PUBLIC_PLAUSIBLE_API ?? `${SITE_CONFIG.basePath}/oc-insights/event`,
    pulseSrc: '',
} as const;

/** FontPreloads draws app-design's logo script; FamilyAnalytics the Plausible sender. */
export const HEAD_SCRIPTS: readonly string[] = [
    logoScript(),
    ...Object.values(familyAnalyticsScripts(ANALYTICS)),
];
