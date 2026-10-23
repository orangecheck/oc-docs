import sources from '@/generated/doc-sources.json';

import { findDocsMeta } from '@/components/docs/nav';

const ERROR_PAGES = new Set(['/', '/404', '/500']);

/**
 * The card a docs page shares: its own title from the docs' nav, split into the
 * headline and the section above it. A page the docs do not have, or none, gets
 * null: the default card. Nothing in a request becomes text on a card.
 */
export function docsCard(
    page: string | null | undefined
): { headline: string; eyebrow: string } | null {
    if (!page || ERROR_PAGES.has(page) || !Object.prototype.hasOwnProperty.call(sources, page)) {
        return null;
    }
    const title = findDocsMeta(page).title;
    if (!title) return null;
    const cut = title.lastIndexOf(' · ');
    return cut > 0
        ? { headline: title.slice(0, cut), eyebrow: title.slice(cut + 3) }
        : { headline: title, eyebrow: 'Docs' };
}
