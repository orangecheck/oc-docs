/**
 * LayoutSubHeader — ecosystem status strip for docs.ochk.io.
 *
 * Same shape as every other OrangeCheck site: heartbeat + live/mainnet on
 * the left, mode tags on the right. Only the content varies.
 */
export function LayoutSubHeader() {
    return (
        <div className="border-b">
            <div className="container flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2 font-mono text-[11px]">
                <div className="flex items-center gap-3">
                    <span className="bg-primary inline-block h-1.5 w-1.5 animate-pulse rounded-full" />
                    <span className="text-muted-foreground tracking-widest uppercase">
                        live · mainnet
                    </span>
                    <span className="text-foreground">oc · docs</span>
                </div>
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 tracking-widest uppercase">
                    <span>specs · api · guides</span>
                    <span className="hidden sm:inline">·</span>
                    <span className="hidden sm:inline">cc-by-4.0</span>
                    <span className="hidden md:inline">·</span>
                    <span className="hidden md:inline">every artifact verifies offline</span>
                </div>
            </div>
        </div>
    );
}
