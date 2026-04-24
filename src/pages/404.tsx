import Link from 'next/link';

import { Seo } from '@/components/layout/Seo';

export default function NotFound() {
    return (
        <>
            <Seo title="Not found" noindex />
            <div className="py-16">
                <div className="label-mono text-primary mb-3">§ 404</div>
                <h1 className="font-display mb-3 text-3xl font-bold tracking-tight md:text-4xl">
                    Page not found.
                </h1>
                <p className="text-muted-foreground mb-6 max-w-2xl text-sm">
                    The page you were looking for doesn&apos;t exist in these docs. Maybe it moved,
                    or maybe it&apos;s on a sibling site.
                </p>
                <ul className="space-y-2 font-mono text-sm">
                    <li>
                        <Link href="/" className="text-primary underline">
                            ← back to the overview
                        </Link>
                    </li>
                    <li>
                        <Link
                            href="/getting-started/which-protocol"
                            className="text-primary underline"
                        >
                            which protocol do I need?
                        </Link>
                    </li>
                    <li>
                        <Link href="/reference/glossary" className="text-primary underline">
                            glossary
                        </Link>
                    </li>
                </ul>
            </div>
        </>
    );
}
