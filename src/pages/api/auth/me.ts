import type { NextApiRequest, NextApiResponse } from 'next';

import { readJwtSession } from '@/lib/auth/session';

/**
 * Crypto-only identity lookup for docs.ochk.io. No DB — we trust the
 * Ed25519 signature + the `exp` claim. Returns the signed-in address
 * so the header can render an account pill alongside the docs nav.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    if (req.method !== 'GET') {
        res.setHeader('Allow', 'GET');
        res.status(405).json({ error: 'method_not_allowed' });
        return;
    }

    const session = await readJwtSession(req);
    if (!session) {
        res.status(401).json({ ok: false });
        return;
    }

    res.status(200).json({
        ok: true,
        account: {
            id: session.sub,
            btc_address: session.addr,
        },
    });
}
