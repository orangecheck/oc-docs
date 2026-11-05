/**
 * The latest version of a package as registry.npmjs.org lists it, once npm
 * serves its tarball. check-sample-imports.mjs and check-snippets.mjs install
 * these versions. Kept apart from the checks so the wait can be tested offline.
 *
 * npm lists a version as latest minutes before it serves the tarball. On
 * 2026-11-03, lock-core 1.5.0 was published at 21:16:25 and its tarball still
 * answered 404 at 21:20:05. The sample-imports check on a docs sync PR for a
 * different package ran in that window and failed, and nothing ran it again.
 * So a version published in the last hour is waited for, for up to 15 minutes,
 * just as the release workflow waits before it opens a sync PR. An older
 * version is not checked here: if it fails to install, the install says why.
 */

const FRESH_MS = 60 * 60_000;
const WAIT_MS = 15 * 60_000;

/**
 * @param {string} pkg
 * @param {{
 *     fetch?: (url: string, init?: { method?: string }) => Promise<Response>,
 *     now?: () => number,
 *     sleep?: (ms: number) => Promise<void>,
 *     log?: (line: string) => void,
 * }} [deps] the network, clock and log, which a test replaces
 * @returns {Promise<{ latest: string, deprecated?: string } | null>} null when npm has no such package
 */
export async function latestServed(
    pkg,
    {
        fetch = globalThis.fetch,
        now = Date.now,
        sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
        log = console.log,
    } = {}
) {
    const res = await fetch(`https://registry.npmjs.org/${pkg.replace('/', '%2f')}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`registry ${res.status} for ${pkg}`);
    const doc = await res.json();
    const latest = doc['dist-tags'].latest;
    const found = { latest, deprecated: doc.versions[latest]?.deprecated };
    const published = doc.time?.[latest];
    if (!(now() - Date.parse(published) < FRESH_MS)) return found;

    const tarball = doc.versions[latest].dist.tarball;
    const deadline = now() + WAIT_MS;
    for (let delay = 10_000; ; delay = Math.min(delay * 2, 120_000)) {
        const head = await fetch(tarball, { method: 'HEAD' });
        if (head.ok) return found;
        if (now() >= deadline) {
            throw new Error(
                `${pkg}@${latest} was published at ${published} and npm still answers ${head.status} for ${tarball}; run this check again once npm serves it`
            );
        }
        log(
            `${pkg}@${latest} was published at ${published}; npm answers ${head.status} for its tarball, waiting ${delay / 1000} s`
        );
        await sleep(delay);
    }
}
