import type { NextApiRequest } from 'next';

import {
    readSessionCookie as readCookie,
    verifySessionToken,
    type SessionPayload,
} from '@orangecheck/auth-core';

/**
 * docs.ochk.io is a read-only consumer of the cross-subdomain oc_session.
 * We hold only the public JWK — never mint or modify sessions.
 */

export type { SessionPayload };

function verifyConfig() {
    const publicJwk = process.env.OC_AUTH_PUBLIC_JWK;
    if (!publicJwk) {
        throw new Error(
            'OC_AUTH_PUBLIC_JWK is not set. docs.ochk.io needs it to verify oc_session cookies.'
        );
    }
    return {
        publicJwk,
        issuer: process.env.OC_AUTH_ISSUER ?? 'https://attest.ochk.io',
    };
}

export async function readJwtSession(req: NextApiRequest): Promise<SessionPayload | null> {
    const token = readCookie(req.headers.cookie ?? null);
    if (!token) return null;
    return verifySessionToken(token, verifyConfig());
}
