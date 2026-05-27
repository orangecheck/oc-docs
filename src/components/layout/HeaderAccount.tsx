'use client';

import { OcAccountMenu } from '@orangecheck/design';

import { SITE_CONFIG } from '@/lib/site.config';

/**
 * Family-consistent account slot for docs.ochk.io. There's no local
 * `/signin` on docs — it's pure read-only content — so the sign-in
 * affordance points at the auth host. Everything else is shared via
 * `<OcAccountMenu>`.
 */
export function HeaderAccount() {
    return (
        <OcAccountMenu
            current={SITE_CONFIG.slug}
            signInUrl="https://ochk.io/signin"
            menuItems={SITE_CONFIG.accountMenuItems}
            siteState={SITE_CONFIG.state}
            build={{
                version: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0',
                sha: process.env.NEXT_PUBLIC_BUILD_SHA ?? 'dev',
                repo: SITE_CONFIG.github,
            }}
        />
    );
}
