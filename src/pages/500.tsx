'use client';

import { OcErrorPage } from '@orangecheck/design';

import { Seo } from '@/components/layout/Seo';

/**
 * 500. The body is `OcErrorPage` from @orangecheck/design so every site in
 * the family shows the same page — this site previously fell through to Next's
 * unstyled default, which carried none of the site's chrome.
 *
 * 'use client' is required: the secondary button calls into window.
 */
export default function ServerError() {
    return (
        <>
            <Seo
                title="Server Error"
                description="An unexpected error occurred on the server."
                noindex={true}
            />
            <OcErrorPage variant="server-error" />
        </>
    );
}
