import { ErrorPage } from '@orangecheck/app-design/components';

import { Seo } from '@/components/layout/Seo';

export default function NotFound() {
    return (
        <>
            <Seo title="Not found" noindex />
            {/* The docs home: the router adds /docs. */}
            <ErrorPage code={404} home="/" />
        </>
    );
}

NotFound.bare = true;
