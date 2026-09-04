/**
 * Where did this request come from, and may a COOKIE session authenticate it?
 *
 * `oc_session` is issued by ochk.io with `SameSite=None; Secure` in
 * production — deliberately, so a sibling subdomain's in-place `/signin` can
 * round-trip a credentialed fetch to the auth host. `setSessionCookie` in
 * oc-www names the compensating control in as many words:
 *
 *   "CSRF is still blocked by the application-level Origin / Sec-Fetch-Site /
 *    isFamilyOrigin gate on every state-changing endpoint."
 *
 * NOTHING IN THIS REPO IS CURRENTLY EXPLOITABLE THROUGH IT — the audit found
 * no authed state-changing route here; this site is a verifier, and its API is
 * public and read-only. The gate is here so that the FIRST authed mutation
 * anyone adds is protected by default, rather than depending on whoever adds
 * it remembering a family contract written in another repo. Seven repos that
 * did have such routes had 108 of them between them, unguarded.
 *
 * The chain that made it reachable: a plain HTML form POST is a CORS "simple
 * request", so it needs no preflight; it arrives as
 * `application/x-www-form-urlencoded`, which Next's default body parser puts
 * in `req.body`; `SameSite=None` means the cookie rides along; and no route
 * validates `Content-Type`. `readJwtSession` then returned a valid session and
 * the mutation ran — as the signed-in user, from any website they visited.
 *
 * Ported from oc-fleet-web's `server/utils/same-origin.ts`, the family's
 * reference implementation.
 */

/** Safe methods change nothing, so their origin does not matter — and every
 *  SSR page load is a cross-site GET when the visitor arrives from a link. */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * The minimal request shape this module reads. Structural rather than
 * `NextApiRequest` so narrower caller types work too.
 */
export interface OriginBearingRequest {
    method?: string | undefined;
    headers: Record<string, string | string[] | undefined>;
}

export type RequestOriginClass = 'same-origin' | 'same-site' | 'cross-site' | 'unknown';

/**
 * `Sec-Fetch-Site` first: every current browser sends it and page JavaScript
 * cannot set it, which is exactly the property a CSRF check needs. `Origin`
 * against `Host` is the fallback.
 */
export function classifyRequestOrigin(req: OriginBearingRequest): RequestOriginClass {
    const secFetchSite = req.headers['sec-fetch-site'];
    if (typeof secFetchSite === 'string') {
        if (secFetchSite === 'same-origin') return 'same-origin';
        if (secFetchSite === 'same-site') return 'same-site';
        // Including any value we do not recognise.
        return 'cross-site';
    }

    const origin = req.headers.origin;
    const host = req.headers.host;
    if (typeof origin === 'string' && typeof host === 'string') {
        try {
            return new URL(origin).host === host ? 'same-origin' : 'cross-site';
        } catch {
            return 'cross-site';
        }
    }

    return 'unknown';
}

/**
 * Should a cookie-borne session be refused for this request?
 *
 * Gating the cookie rather than each route is deliberate: what makes CSRF work
 * is a credential the browser attaches by itself, and a guard every route has
 * to remember is a guard every route forgot. `same-site` stays permitted
 * because the family shares `.ochk.io` and siblings legitimately post to one
 * another; `unknown` does not, because a request that will not say where it
 * came from should not change state on a cookie.
 */
export function refuseCookieSession(req: OriginBearingRequest): boolean {
    if (SAFE_METHODS.has(req.method ?? 'GET')) return false;
    const c = classifyRequestOrigin(req);
    return c === 'cross-site' || c === 'unknown';
}
