import { ErrorPage } from '@orangecheck/app-design/components';

import { Seo } from '@/components/layout/Seo';

export default function ServerError() {
    return (
        <>
            <Seo
                title="Server Error"
                description="An unexpected error occurred on the server."
                noindex={true}
            />
            <ErrorPage code={500} />
        </>
    );
}

ServerError.bare = true;
