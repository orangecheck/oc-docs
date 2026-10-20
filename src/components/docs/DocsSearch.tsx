import { SearchDialog } from '@orangecheck/app-design/components';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { routeOf, searchDocs } from '@/lib/search';

/**
 * Search the docs from the header: ⌘K or / anywhere, or `?q=` in the address.
 * The index is the docs' own pages (see lib/search.ts).
 */
export function DocsSearch() {
    const router = useRouter();
    const q = router.isReady && typeof router.query.q === 'string' ? router.query.q : '';
    // Open with a `?q=` until the reader opens or closes it themselves.
    const [chosen, setOpen] = useState<boolean | null>(null);
    const open = chosen ?? Boolean(q);
    return (
        <SearchDialog
            // A `?q=` arrives after hydration; the dialog reads it as it mounts.
            key={q}
            defaultQuery={q}
            open={open}
            onOpenChange={setOpen}
            onQuery={searchDocs}
            // Every docs result is a page; a result without one would be an action.
            onSelect={(r) => {
                if (r.href) void router.push(routeOf(r.href));
            }}
            placeholder="Search the docs"
        />
    );
}
