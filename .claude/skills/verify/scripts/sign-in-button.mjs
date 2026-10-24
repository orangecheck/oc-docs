// Drives /integration/sign-in-button in Chromium at 390 and 1440, light and dark:
// three made-up sites each draw the orangecheck button in their own style. Checks
// no sideways scroll, each button as tall as the site's own, words on one line,
// the mono mark's contrast, and that Tab reaches each one and Enter or Space opens
// one sign-in window. window.open is replaced in the page, so no window opens and
// nothing is sent.
//
//   node .claude/skills/verify/scripts/sign-in-button.mjs [--base https://ochk.io/docs] [--shots <dir>]
//
// One PASS or FAIL line per check; exit 1 on any FAIL. Playwright comes from
// PLAYWRIGHT_MODULE (a path to playwright's index.mjs) or a resolvable `playwright`.

const args = process.argv.slice(2);
const opt = (name, fallback) => {
    const i = args.indexOf(`--${name}`);
    return i > -1 ? args[i + 1] : fallback;
};
const BASE = opt('base', 'https://ochk.io/docs').replace(/\/$/, '');
const SHOTS = opt('shots', '');

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

const HOSTS = ['ledger', 'studio', 'lantern'];
const browser = await pw.chromium.launch({ args: ['--use-angle=swiftshader'] });
try {
    for (const [width, height] of [
        [390, 844],
        [1440, 900],
    ]) {
        for (const scheme of ['light', 'dark']) {
            const tag = `${width} ${scheme}`;
            const ctx = await browser.newContext({
                viewport: { width, height },
                colorScheme: scheme,
            });
            await ctx.addInitScript(() => {
                window.__opens = 0;
                window.open = () => {
                    window.__opens++;
                    return { closed: false, focus() {}, close() {} };
                };
            });
            const page = await ctx.newPage();
            const errors = [];
            page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));
            const res = await page.goto(`${BASE}/integration/sign-in-button`, {
                waitUntil: 'domcontentloaded',
            });
            await page.waitForSelector('[data-demo-host] [data-oc-sign-in] svg[data-oc-mark]');
            await page.evaluate(() => document.fonts.ready);
            if (width === 390 && scheme === 'light')
                check(res?.status() === 200, 'the page answers 200', `${res?.status()}`);

            const cards = await page.evaluate(() => {
                const rgb = (c) => {
                    const m = c.match(/[\d.]+/g).map(Number);
                    return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 };
                };
                const lum = ({ r, g, b }) => {
                    const f = (v) =>
                        (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
                    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
                };
                const ratio = (x, y) => {
                    const [hi, lo] = [lum(x), lum(y)].sort((p, q) => q - p);
                    return (hi + 0.05) / (lo + 0.05);
                };
                const mix = (fg, a, bg) => ({
                    r: fg.r * a + bg.r * (1 - a),
                    g: fg.g * a + bg.g * (1 - a),
                    b: fg.b * a + bg.b * (1 - a),
                });
                const ground = (el) => {
                    for (let e = el; e; e = e.parentElement) {
                        const c = rgb(getComputedStyle(e).backgroundColor);
                        if (c.a > 0.5) return c;
                    }
                    return { r: 255, g: 255, b: 255 };
                };
                return [...document.querySelectorAll('[data-demo-host]')].map((host) => {
                    const own = host.querySelector('button:not([data-oc-sign-in])');
                    const ocs = [...host.querySelectorAll('[data-oc-sign-in]')];
                    const words = ocs.find((b) => b.querySelector('[data-oc-label]'));
                    const alone = ocs.find((b) => b.getAttribute('data-label') === 'none');
                    const label = words.querySelector('[data-oc-label]');
                    const range = document.createRange();
                    range.selectNodeContents(label);
                    const svg = words.querySelector('svg[data-oc-mark]');
                    const fg = rgb(getComputedStyle(words).color);
                    const bg = ground(words);
                    const faces = [...svg.querySelectorAll('polygon')].map((p) =>
                        Number(p.getAttribute('fill-opacity') ?? 1)
                    );
                    const shades = faces.map((a) => mix(fg, a, bg));
                    const steps = [
                        ratio(shades[0], shades[1]),
                        ratio(shades[0], shades[2]),
                        ratio(shades[1], shades[2]),
                    ];
                    const h = (b) => Math.round(b.getBoundingClientRect().height * 10) / 10;
                    const a = alone?.getBoundingClientRect();
                    return {
                        host: host.dataset.demoHost,
                        own: h(own),
                        heights: ocs.map(h),
                        lines: range.getClientRects().length,
                        mono: svg.dataset.ocMark === 'mono',
                        top: ratio(fg, bg),
                        step: Math.min(...steps),
                        alone: a
                            ? {
                                  w: Math.round(a.width),
                                  h: Math.round(a.height),
                                  name: alone.getAttribute('aria-label'),
                              }
                            : null,
                    };
                });
            });
            const overflow = await page.evaluate(
                () => document.documentElement.scrollWidth - innerWidth
            );
            check(overflow <= 0, `${tag}: no sideways scroll`, `${overflow}px over`);
            check(cards.length === 3, `${tag}: three sites`, cards.map((c) => c.host).join(', '));
            for (const c of cards) {
                check(
                    c.heights.every((x) => Math.abs(x - c.own) < 0.5),
                    `${tag} ${c.host}: as tall as the site's own button`,
                    `${c.heights.join(', ')} vs ${c.own}`
                );
                check(c.lines === 1, `${tag} ${c.host}: the words on one line`, `${c.lines} lines`);
                check(
                    c.mono && c.top >= 3,
                    `${tag} ${c.host}: mono mark at 3:1 or more`,
                    `${c.top.toFixed(2)}:1, smallest step between faces ${c.step.toFixed(2)}`
                );
                check(
                    !!c.alone &&
                        c.alone.w >= 44 &&
                        c.alone.h >= 44 &&
                        /orangecheck/.test(c.alone.name ?? ''),
                    `${tag} ${c.host}: the mark alone is named and at least 44px`,
                    c.alone ? `${c.alone.w}x${c.alone.h} "${c.alone.name}"` : 'none on the page'
                );
            }
            if (SHOTS)
                await page
                    .locator('[data-demo="hosts"]')
                    .screenshot({ path: `${SHOTS}/hosts-${width}-${scheme}.png` });

            // Keyboard: from each site's own button, Tab reaches the orangecheck button; Enter (or Space) opens one window.
            for (const [i, host] of HOSTS.entries()) {
                const key = i % 2 ? 'Space' : 'Enter';
                await page
                    .locator(`[data-demo-host="${host}"] button:not([data-oc-sign-in])`)
                    .focus();
                await page.keyboard.press('Tab');
                const focused = await page.evaluate(
                    (h) =>
                        document.activeElement?.closest(`[data-demo-host="${h}"]`) !== null &&
                        document.activeElement?.hasAttribute('data-oc-sign-in'),
                    host
                );
                const before = await page.evaluate(() => window.__opens);
                await page.keyboard.press(key);
                await page.waitForTimeout(100);
                const after = await page.evaluate(() => ({
                    opens: window.__opens,
                    busy: document.activeElement?.getAttribute('aria-busy'),
                }));
                check(
                    focused && after.opens - before === 1 && after.busy === 'true',
                    `${tag} ${host}: Tab reaches it, ${key} opens one sign-in window`,
                    `focused ${focused}, ${after.opens - before} window, aria-busy ${after.busy}`
                );
            }
            check(errors.length === 0, `${tag}: no page errors`, errors.join(' | '));
            await ctx.close();
        }
    }
} finally {
    await browser.close();
}
process.exit(failed ? 1 : 0);
