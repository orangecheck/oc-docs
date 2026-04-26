import type { SessionPayload } from '@orangecheck/auth-core';
import type { NextApiRequest } from 'next';

import { SESSION_COOKIE, verifySessionToken } from '@orangecheck/auth-core';

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
 * Yield every oc_session value in the request's Cookie header. Browsers
 * legitimately send multiple cookies with the same name when their effective
 * Domains differ (a host-only cookie from a pre-Move-3 deploy alongside the
 * canonical .ochk.io cookie). Picking only the first match would 401 a
 * legitimately-authenticated caller whose stale duplicate happens to come
 * earlier in the Cookie header.
 */
function* readAllSessionTokens(cookieHeader: string | null | undefined): Generator<string> {
    if (!cookieHeader) return;
    const prefix = `${SESSION_COOKIE}=`;
    for (const part of cookieHeader.split(';')) {
        const trimmed = part.trim();
        if (trimmed.startsWith(prefix)) {
            const val = trimmed.slice(prefix.length);
            if (val.length > 0) yield val;
        }
    }
}

export async function readJwtSession(req: NextApiRequest): Promise<SessionPayload | null> {
    const cfg = verifyConfig();
    for (const token of readAllSessionTokens(req.headers.cookie)) {
        const payload = await verifySessionToken(token, cfg);
        if (payload) return payload;
    }
    return null;
}
