import { ErrorPage } from '@orangecheck/app-design/components';

import { Seo } from '@/components/layout/Seo';

export default function NotFound() {
    return (
        <>
            <Seo title="Not found" noindex />
            <ErrorPage code={404} />
        </>
    );
}

NotFound.bare = true;
