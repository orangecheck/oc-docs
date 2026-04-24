'use client';

import { useOcSession } from '@orangecheck/auth-client';

function shortenAddress(addr: string): string {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Mirror of ochk.io / attest.ochk.io HeaderAccount — same pattern, same
 * shape. When a user signs in on any ochk.io subdomain, docs.ochk.io
 * reflects that immediately via the Domain=.ochk.io cookie.
 */
export function HeaderAccount() {
    const { status, account, signInUrl, signOut } = useOcSession();

    if (status === 'loading') return null;

    if (status !== 'authenticated' || !account) {
        return (
            <a
                href={signInUrl}
                className="font-display text-muted-foreground hover:text-foreground border-l px-3 py-1 text-[12px] font-semibold tracking-wider uppercase transition-colors"
            >
                sign in
            </a>
        );
    }

    return (
        <div className="flex items-center gap-2 border-l pl-3">
            <a
                href="https://attest.ochk.io/dashboard"
                className="text-muted-foreground hover:text-foreground font-mono text-[12px] tracking-tight transition-colors"
                title={account.address}
            >
                {shortenAddress(account.address)}
            </a>
            <button
                type="button"
                onClick={() => {
                    void signOut();
                }}
                aria-label="Sign out"
                className="text-muted-foreground hover:text-foreground font-mono text-[11px] tracking-wider uppercase transition-colors"
            >
                sign out
            </button>
        </div>
    );
}
