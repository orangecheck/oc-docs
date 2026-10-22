import type { NextApiRequest, NextApiResponse } from 'next';

/** An API address this host does not serve. Callers parse JSON, so they get JSON, not a page. */
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(404).json({ ok: false, error: 'not_found' });
}
