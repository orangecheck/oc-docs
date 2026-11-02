/**
 * The URLs check-doc-links.mjs is told not to call broken, and how it counts
 * each answer. Kept apart from the run so the counting can be tested offline.
 *
 * An entry that names a live endpoint pins the status it answers, and any
 * other status fails the run, a 5xx or a timeout included: otherwise a route
 * that broke or was removed would count as skipped. An entry without a status
 * is prose (an API root, a glob), skipped whatever it answers.
 */

/** URLs that are SUPPOSED to fail — illustrative, not navigational. */
export const EXPECTED_404 = new Map([
    ['https://me.ochk.io/api/', { reason: 'prose reference to the API root, not an endpoint' }],
    [
        'https://me.ochk.io/api/integrator/config?project_key=pk_live_yourco',
        {
            status: 404,
            reason: 'placeholder project key — pk_live_yourco is not a real integrator',
        },
    ],
    [
        'https://attest.ochk.io/api/check?addr=bc1qhtl83u7jsf94lp70z0tzfmws7za0hv35n5zugm',
        {
            status: 404,
            // Its witness program is sha256('orangecheck docs: an address nobody can sign for'),
            // first 20 bytes: no known key hashes to it, so nobody can attest it and flip the 404.
            reason: 'the quickstart deliberately shows the never-attested case, which is a 404 by design',
        },
    ],
]);

/** 'ok', 'expected' or 'broken' for a URL that answered `status` (0 for no answer). */
export function classify(url, status, expected = EXPECTED_404) {
    const entry = expected.get(url);
    if (entry?.status !== undefined) return status === entry.status ? 'expected' : 'broken';
    if ((status >= 200 && status < 400) || status === 401 || status === 403 || status === 405) {
        return 'ok';
    }
    return entry ? 'expected' : 'broken';
}
