// Drives the docs search in Chromium: opens it by `?q=`, by `/` and by ⌘K/Ctrl+K,
// types a query, and opens the first result. Read-only: the page fetches its own
// search index and nothing else is sent.
//
//   node .claude/skills/verify/scripts/docs-search.mjs [--base https://ochk.io/docs] [--q "device revocation"] [--expect /lock/]
//
// One PASS or FAIL line per check; exit 1 on any FAIL. Playwright comes from
// PLAYWRIGHT_MODULE (a path to playwright's index.mjs) or a resolvable `playwright`.

const args = process.argv.slice(2);
const opt = (name, fallback) => {
    const i = args.indexOf(`--${name}`);
    return i > -1 ? args[i + 1] : fallback;
};
const BASE = opt('base', 'https://ochk.io/docs').replace(/\/$/, '');
const Q = opt('q', 'device revocation');
const EXPECT = opt('expect', '/lock/');

let pw;
try {
    pw = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
} catch {
    console.error('Playwright not found. Set PLAYWRIGHT_MODULE to a playwright index.mjs.');
    process.exit(2);
}

let failed = 0;
const check = (ok, what, detail = '') => {
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}${detail ? `  (${detail})` : ''}`);
};

const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.route('**/*', (route) =>
    /plausible\.io|\/oc-insights/.test(route.request().url())
        ? route.fulfill({ status: 202, body: '' })
        : route.continue()
);
const box = () => page.getByPlaceholder('Search the docs');
const results = () => page.getByRole('dialog').locator(`a[href*="${EXPECT}"], [role="option"]`);
console.log(`== docs search on ${BASE}, query "${Q}"`);
try {
    await page.goto(`${BASE}/?q=${encodeURIComponent(Q)}`, { waitUntil: 'domcontentloaded' });
    const opened = await box()
        .waitFor({ timeout: 20000 })
        .then(
            () => true,
            () => false
        );
    check(opened, '?q= opens the search with the query', opened ? await box().inputValue() : '');
    const listed = await results()
        .first()
        .waitFor({ timeout: 15000 })
        .then(
            () => true,
            () => false
        );
    const text = listed ? (await page.getByRole('dialog').innerText()).replace(/\s+/g, ' ') : '';
    check(listed, 'it lists results', text.slice(0, 120));
    await page.keyboard.press('Enter');
    await page.waitForURL((u) => !u.search.includes('q='), { timeout: 15000 }).catch(() => {});
    const landed = new URL(page.url()).pathname;
    check(landed.startsWith('/docs/') && landed !== '/docs/', 'Enter opens a docs page', landed);

    await page.goto(`${BASE}/lock`, { waitUntil: 'networkidle' });
    await page.keyboard.press('/');
    check(
        await box()
            .waitFor({ timeout: 10000 })
            .then(
                () => true,
                () => false
            ),
        '/ opens the search'
    );
    await page.keyboard.press('Escape');
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+K' : 'Control+K');
    check(
        await box()
            .waitFor({ timeout: 10000 })
            .then(
                () => true,
                () => false
            ),
        'Ctrl+K opens the search'
    );
} catch (err) {
    check(false, 'the recipe ran to the end', String(err?.message ?? err).split('\n')[0]);
}
await browser.close();
process.exit(failed ? 1 : 0);
