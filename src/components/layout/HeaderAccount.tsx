'use client';

import { useOcSession } from '@orangecheck/auth-client';
import { LogOut } from 'lucide-react';

function shortenAddress(addr: string): string {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/**
 * Family-consistent account slot. Same shape on every ochk.io subdomain:
 *
 *   unauthenticated → "sign in" link
 *   authenticated   → <addr-chip>  ⎋  (LogOut icon, no redundant word)
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
        <div className="flex items-center gap-1.5 border-l pl-2">
            <a
                href="https://ochk.io/dashboard"
                title={account.address}
                className="bg-muted/40 hover:bg-muted text-foreground inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[11px] tabular-nums transition-colors"
            >
                {shortenAddress(account.address)}
            </a>
            <button
                type="button"
                onClick={() => void signOut()}
                aria-label="Sign out"
                title="Sign out"
                className="text-muted-foreground hover:text-foreground inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors"
            >
                <LogOut className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}
