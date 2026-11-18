import { logoScript } from '@orangecheck/app-design/brand';
import { familyAnalyticsScripts } from '@orangecheck/site-kit/analytics';

/*
 * Every inline script _document's head runs, as the page carries it. script-src
 * lists each by hash (next.config) in place of 'unsafe-inline', with the theme
 * script app-design's ThemeProvider writes in _app. next.config loads this, so
 * imports here are packages or relative paths, never '@/'.
 */

/** FamilyAnalytics' props: oc-pulse runs on ochk.io itself only, so a preview deploy counts nothing. */
export const ANALYTICS = { origins: ['https://ochk.io'] } as const;

/** FontPreloads draws app-design's logo script; FamilyAnalytics the oc-pulse loader. */
export const HEAD_SCRIPTS: readonly string[] = [
    logoScript(),
    ...Object.values(familyAnalyticsScripts(ANALYTICS)),
];
