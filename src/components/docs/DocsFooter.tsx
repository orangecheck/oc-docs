import { SiteFooter, ThemeToggle } from '@orangecheck/app-design/chrome';
import { OCHK_IO_FOOTER } from '@orangecheck/app-design/family';

/** ochk.io's footer, word for word: the docs are a part of ochk.io. */
export function DocsFooter() {
    return (
        <SiteFooter
            columns={OCHK_IO_FOOTER}
            family
            legal
            fineprint="Open protocols on Bitcoin. Anyone can check the result."
            meta={
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <p>
                        Open-source work on orangecheck is{' '}
                        <span className="whitespace-nowrap">supported by OpenSats.</span>
                    </p>
                    <ThemeToggle className="-mx-3" />
                </div>
            }
        />
    );
}
