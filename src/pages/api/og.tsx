import { createOgHandler } from '@orangecheck/site-kit/og';

import { DOCS_CARDS } from '@/lib/seo/og-card';

/**
 * The docs share card, 1200×630 PNG: the family's card from site-kit, kept a
 * day by the browser and the edge.
 *
 * `?page=<path>` draws that docs page's own title, with its section above; the
 * route alone draws the default. Any other query is sent there with a 308,
 * under /docs, so no request puts its own words on a card, nor makes the site
 * render on demand.
 */
export default createOgHandler({
    cards: DOCS_CARDS,
    defaultTitle: 'the orangecheck handbook.',
    product: 'docs',
    eyebrow: 'Docs',
    host: 'ochk.io/docs',
    basePath: '/docs',
});
