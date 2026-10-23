import type { NextApiRequest, NextApiResponse } from 'next';

import { OG_SIZE, OgCard, ogFonts } from '@orangecheck/app-design/og';
import { ImageResponse } from 'next/og';

import { docsCard } from '@/lib/seo/og-card';

/**
 * The docs share card, 1200×630 PNG. `?page=<path>` draws that docs page's own
 * title, with its section above; anything else, `?title=` included, draws the
 * default card, so a card never carries a caller's text.
 *
 * A Pages route on the node runtime: a returned Response would be ignored,
 * so the image is copied onto `res`, headers included.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const page = new URL(req.url ?? '/', 'http://docs.invalid').searchParams.get('page');
    const card = docsCard(page) ?? { headline: 'the orangecheck handbook.', eyebrow: 'Docs' };
    const image = new ImageResponse(
        <OgCard product="docs" eyebrow={card.eyebrow} title={card.headline} host="ochk.io/docs" />,
        { ...OG_SIZE, fonts: ogFonts() }
    );
    image.headers.forEach((value, key) => res.setHeader(key, value));
    res.status(image.status).send(Buffer.from(await image.arrayBuffer()));
}
