import type { NextApiRequest, NextApiResponse } from 'next';

import { generateKeyPairSync, randomUUID } from 'node:crypto';

import meHandler from '@/pages/api/auth/me';
import {
    _resetFamilyRevocationCheckForTests,
    revocationKey,
    signSession,
} from '@orangecheck/auth-core';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * A session ochk.io ended (signed out, replaced, cut off) is no session here.
 * The token is real, signed with a key pinned as OC_AUTH_PUBLIC_JWK; ochk.io's
 * revocation feed is a stubbed fetch, so this runs the real reader and check.
 */

const DID = `did:oc:${'1'.repeat(32)}`;
let privateJwk = '';
const saved = { pub: process.env.OC_AUTH_PUBLIC_JWK, iss: process.env.OC_AUTH_ISSUER };

beforeAll(() => {
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const b64 = (k: object) => Buffer.from(JSON.stringify(k)).toString('base64url');
    const extra = { kid: 'test-key', alg: 'EdDSA' };
    process.env.OC_AUTH_PUBLIC_JWK = b64({ ...publicKey.export({ format: 'jwk' }), ...extra });
    process.env.OC_AUTH_ISSUER = 'https://ochk.io';
    privateJwk = b64({ ...privateKey.export({ format: 'jwk' }), ...extra });
});

afterAll(() => {
    for (const [k, v] of [
        ['OC_AUTH_PUBLIC_JWK', saved.pub],
        ['OC_AUTH_ISSUER', saved.iss],
    ] as const) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
    }
});

let feed: { v: 1; at: number; tokens: string[]; accounts: Record<string, number> };

beforeEach(() => {
    _resetFamilyRevocationCheckForTests();
    feed = { v: 1, at: 0, tokens: [], accounts: {} };
    vi.stubEnv('OC_REVOCATION_FEED_TOKEN', 'docs-feed-token');
    vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string) => {
            expect(url).toBe('https://ochk.io/api/auth/revocations');
            return Response.json(feed);
        })
    );
});
afterEach(() => {
    _resetFamilyRevocationCheckForTests();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
});

async function mint(jti: string): Promise<string> {
    return signSession(
        { sub: 'acct-1', did_oc: DID, jti },
        { publicJwk: process.env.OC_AUTH_PUBLIC_JWK!, privateJwk, kid: 'test-key' },
        3600
    );
}

async function me(token: string): Promise<{ ok: boolean; account?: { did_oc: string } }> {
    let body: unknown;
    const res = {
        setHeader: () => res,
        status: () => res,
        json: (b: unknown) => {
            body = b;
            return res;
        },
    } as unknown as NextApiResponse;
    const req = {
        method: 'GET',
        headers: { cookie: `oc_session=${token}`, 'sec-fetch-site': 'same-origin' },
    } as unknown as NextApiRequest;
    await meHandler(req, res);
    return body as { ok: boolean; account?: { did_oc: string } };
}

describe('a session ochk.io ended is not a caller', () => {
    it('signs out a revoked cookie and keeps a live one', async () => {
        const ended = randomUUID();
        feed.tokens = [await revocationKey('jti', ended)];
        expect(await me(await mint(ended))).toEqual({ ok: false });
        expect((await me(await mint(randomUUID()))).account?.did_oc).toBe(DID);
    });

    it('signs out every token of an account cut off after it was issued', async () => {
        const token = await mint(randomUUID());
        const iat = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString()).iat;
        feed.accounts = { [await revocationKey('sub', 'acct-1')]: iat + 1 };
        expect((await me(token)).ok).toBe(false);
    });
});
