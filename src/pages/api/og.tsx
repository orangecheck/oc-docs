import type { NextApiRequest, NextApiResponse } from 'next';

import { OG_SIZE, OgCard, ogFonts } from '@orangecheck/app-design/og';
import { ImageResponse } from 'next/og';

/** The docs' share card, 1200×630 PNG: the family card with the lockup and "docs". */
async function render() {
    return new ImageResponse(
        <OgCard
            title="the orangecheck handbook."
            eyebrow="Docs"
            product="docs"
            host="ochk.io/docs"
        />,
        { ...OG_SIZE, fonts: ogFonts() }
    );
}

/**
 * The exported handler is a thin adapter over `render`, which returns a Web
 * `ImageResponse` as the original edge handler did.
 *
 * next 16 deprecates the Edge Runtime, and `config = { runtime: 'edge' }` is
 * not decoration on a Pages API route — it selects the handler contract. With
 * it the route is a Web handler returning a Response. Without it the route is
 * `(req, res)` and a returned Response is ignored, so deleting the flag alone
 * yields a route that type-checks, builds clean, and fails on every request.
 *
 * This route takes no request input — the image is static — so `render` needs
 * no argument. Headers are copied off the ImageResponse rather than invented.
 */
export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
    const image = await render();
    image.headers.forEach((value, key) => res.setHeader(key, value));
    res.status(image.status).send(Buffer.from(await image.arrayBuffer()));
}
