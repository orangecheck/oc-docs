import type { SessionPayload } from '@orangecheck/auth-core';
import type { NextApiRequest } from 'next';

import { resolveSessionFromRequest } from '@orangecheck/auth-core';

/**
 * oc-docs is a CONSUMER of the cross-subdomain oc_session.
 * The auth host lives at ochk.io. We hold only the public JWK, never
 * mint or modify sessions.
 */

export type { SessionPayload };

function verifyConfig() {
    const publicJwk = process.env.OC_AUTH_PUBLIC_JWK;
    if (!publicJwk) {
        throw new Error(
            'OC_AUTH_PUBLIC_JWK is not set. oc-docs.ochk.io needs it to verify oc_session cookies.'
        );
    }
    return {
        publicJwk,
        issuer: process.env.OC_AUTH_ISSUER ?? 'https://ochk.io',
    };
}

/**
 * Resolve the EFFECTIVE session: the per-tab x-oc-tab-session header
 * first (a full session JWT - auth-core fails closed on an invalid
 * one), then every oc_session cookie in the jar.
 */
export async function readJwtSession(req: NextApiRequest): Promise<SessionPayload | null> {
    const r = await resolveSessionFromRequest(req.headers, verifyConfig());
    return r.ok ? r.payload : null;
}
