'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

/**
 * ThemeBridge — cross-subdomain theme persistence.
 *
 * `next-themes` defaults to `localStorage`, which is origin-scoped — a user
 * who flips dark / light on `lock.ochk.io` won't see the choice carry over
 * to `vote.ochk.io`. This component layers a `Domain=.ochk.io` cookie on
 * top so the choice is visible to every site in the family.
 *
 * The bridge:
 *   1. On mount, reads the `oc_theme` cookie. If it's set and differs from
 *      next-themes' current value, calls setTheme() to align.
 *   2. Whenever next-themes' theme changes, writes the new value to the
 *      `oc_theme` cookie with Domain=.ochk.io, Path=/, SameSite=Lax,
 *      one-year Max-Age. SECURE-only in production (HTTPS) so the cookie
 *      isn't sent over plaintext, but absent on localhost so dev still
 *      works.
 *
 * The cookie is intentionally non-HttpOnly — the JS in next-themes needs
 * to read + write it. `oc_theme` carries no auth value; the only cost of a
 * leak is "an observer learns the user's preferred theme."
 *
 * Mount this once inside `<ThemeProvider>` on every site:
 *
 *     <ThemeProvider …>
 *         <ThemeBridge />
 *         …
 *     </ThemeProvider>
 */
const COOKIE = 'oc_theme';
const ALLOWED = new Set(['light', 'dark', 'system']);
const ONE_YEAR = 60 * 60 * 24 * 365;

function readCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const prefix = `${name}=`;
    for (const part of document.cookie.split(';')) {
        const trimmed = part.trim();
        if (trimmed.startsWith(prefix)) {
            const v = decodeURIComponent(trimmed.slice(prefix.length));
            return v.length > 0 ? v : null;
        }
    }
    return null;
}

function writeCookie(value: string): void {
    if (typeof document === 'undefined') return;
    if (!ALLOWED.has(value)) return;
    const isLocal =
        location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const parts = [
        `${COOKIE}=${encodeURIComponent(value)}`,
        'Path=/',
        `Max-Age=${ONE_YEAR}`,
        'SameSite=Lax',
    ];
    if (!isLocal) {
        parts.push('Domain=.ochk.io');
        parts.push('Secure');
    }
    document.cookie = parts.join('; ');
}

export function ThemeBridge() {
    const { theme, setTheme } = useTheme();
    const hydratedRef = useRef(false);

    // Hydration: pull the cookie value into next-themes once on mount.
    useEffect(() => {
        if (hydratedRef.current) return;
        hydratedRef.current = true;

        const cookieValue = readCookie(COOKIE);
        if (cookieValue && ALLOWED.has(cookieValue) && cookieValue !== theme) {
            setTheme(cookieValue);
        }
    }, [theme, setTheme]);

    // Persistence: write the cookie whenever next-themes reports a change.
    useEffect(() => {
        if (!hydratedRef.current) return;
        if (!theme) return;
        writeCookie(theme);
    }, [theme]);

    return null;
}
