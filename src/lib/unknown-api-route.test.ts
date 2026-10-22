import type { NextApiRequest, NextApiResponse } from 'next';

import handler from '@/pages/api/[...unknown]';
import { describe, expect, it } from 'vitest';

/** Calls the handler with the smallest response it can write to. */
function call(method: string) {
    const out = { status: 0, headers: {} as Record<string, string>, body: undefined as unknown };
    const res = {
        setHeader(name: string, value: string) {
            out.headers[name.toLowerCase()] = value;
            return res;
        },
        status(code: number) {
            out.status = code;
            return res;
        },
        json(body: unknown) {
            out.body = body;
            return res;
        },
    };
    handler({ method } as NextApiRequest, res as unknown as NextApiResponse);
    return out;
}

// Without this route a POST to an address nothing serves got the HTML
// "Not found" page with status 200, which a client checking `res.ok` reads as success.
describe('an /api address nothing serves', () => {
    it.each(['GET', 'POST', 'PUT', 'DELETE'])('answers %s with a JSON 404', (method) => {
        const out = call(method);
        expect(out.status).toBe(404);
        expect(out.body).toEqual({ ok: false, error: 'not_found' });
        expect(out.headers['cache-control']).toBe('no-store');
    });
});
