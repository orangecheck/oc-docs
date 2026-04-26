'use client';

import { OcAccountChip } from '@orangecheck/auth-client';

/**
 * Family-consistent account slot. Renders the OcAccountChip from
 * @orangecheck/auth-client — pill trigger + popover with full address,
 * dashboard link, sign-out. Same shape on every ochk.io subdomain.
 */
export function HeaderAccount() {
    return <OcAccountChip dashboardUrl="https://ochk.io/dashboard" />;
}
