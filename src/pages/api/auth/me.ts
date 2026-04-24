import type { NextApiRequest, NextApiResponse } from 'next';

import { readJwtSession } from '@/lib/auth/session';

/**
 * Crypto-only identity lookup. No DB — we trust the Ed25519 signature and
 * the `exp` claim on the cross-subdomain oc_session cookie minted by the
 * auth host at ochk.io.
 *
 * `Cache-Control: no-store` + `Vary: Cookie` are non-negotiable: without
 * them a cached 401 (anonymous) can be served to an authenticated caller,
 * leaving the header stuck on "sign in" even though the cookie is present.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
    res.setHeader('Cache-Control', 'no-store, private');
    res.setHeader('Vary', 'Cookie');

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
