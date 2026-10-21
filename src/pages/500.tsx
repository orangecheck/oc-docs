import { ErrorPage } from '@orangecheck/app-design/components';

import { Seo } from '@/components/layout/Seo';

export default function ServerError() {
    return (
        <>
            <Seo
                title="Server Error"
                description="An unexpected error occurred on the server."
                canonical={null}
                noindex={true}
            />
            {/* The docs home: the router adds /docs. */}
            <ErrorPage code={500} home="/" />
        </>
    );
}

ServerError.bare = true;
