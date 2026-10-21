import type { NextApiRequest, NextApiResponse } from 'next';

import { OG_SIZE, OgCard, ogFonts } from '@orangecheck/app-design/og';
import { ogTitle } from '@orangecheck/site-kit/og';
import { ImageResponse } from 'next/og';

/**
 * The docs share card, 1200×630 PNG. `?title=` is the page's title; a title
 * in the docs' "Page · Section" form puts the section above it.
 *
 * A Pages route on the node runtime: a returned Response would be ignored,
 * so the image is copied onto `res`, headers included.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const title = ogTitle(req.url, { defaultTitle: 'the orangecheck handbook.' });
    const cut = title.lastIndexOf(' · ');
    const [headline, eyebrow] =
        cut > 0 ? [title.slice(0, cut), title.slice(cut + 3)] : [title, 'Docs'];
    const image = new ImageResponse(
        <OgCard product="docs" eyebrow={eyebrow} title={headline} host="ochk.io/docs" />,
        { ...OG_SIZE, fonts: ogFonts() }
    );
    image.headers.forEach((value, key) => res.setHeader(key, value));
    res.status(image.status).send(Buffer.from(await image.arrayBuffer()));
}
