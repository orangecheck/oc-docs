/**
 * Renders the fleet.ochk.io reason catalog.
 *
 * Source data lives at src/generated/fleet-catalogs.json — refreshed
 * at build time by scripts/gen-catalogs.mjs which fetches from
 * https://fleet.ochk.io/api/reasons. Drift between code and docs is
 * thereby mechanically impossible: every deploy of docs picks up the
 * latest typed catalog, and the typed catalog itself is enforced by
 * the contract tests in oc-fleet-web.
 *
 * Renders as a sortable, kind-grouped table similar to the original
 * hand-maintained one — but every row is data-driven.
 */
import catalogs from '@/generated/fleet-catalogs.json';

type ReasonKind =
    | 'auth'
    | 'input'
    | 'tenancy'
    | 'method'
    | 'conflict'
    | 'rate'
    | 'config'
    | 'external'
    | 'internal';

interface ReasonEntry {
    id: string;
    kind: ReasonKind;
    status: number;
    description: string;
}

const KIND_ORDER: ReasonKind[] = [
    'auth',
    'input',
    'tenancy',
    'method',
    'conflict',
    'rate',
    'config',
    'external',
    'internal',
];

const KIND_LABEL: Record<ReasonKind, string> = {
    auth: 'auth · 401/403',
    input: 'input · 400',
    tenancy: 'tenancy · 404',
    method: 'method · 405',
    conflict: 'conflict · 409',
    rate: 'rate · 429',
    config: 'config · 503',
    external: 'external · 5xx',
    internal: 'internal · 500',
};

export function FleetReasonCatalog() {
    const reasons = (catalogs.reasons ?? []) as ReasonEntry[];
    const grouped = new Map<ReasonKind, ReasonEntry[]>();
    for (const r of reasons) {
        if (!grouped.has(r.kind)) grouped.set(r.kind, []);
        grouped.get(r.kind)!.push(r);
    }
    for (const list of grouped.values()) {
        list.sort((a, b) => (a.id < b.id ? -1 : 1));
    }

    if (reasons.length === 0) {
        return (
            <div className="text-muted-foreground my-6 rounded border border-dashed p-4 text-sm">
                Catalog not available — the build-time fetch from
                <code className="mx-1">https://fleet.ochk.io/api/reasons</code>
                returned empty. Refresh once the endpoint deploys.
            </div>
        );
    }

    return (
        <div className="my-6 space-y-6">
            {KIND_ORDER.map((kind) => {
                const rows = grouped.get(kind);
                if (!rows || rows.length === 0) return null;
                return (
                    <div key={kind}>
                        <h4 className="text-muted-foreground mb-2 font-mono text-[11px] tracking-widest uppercase">
                            {KIND_LABEL[kind]}
                        </h4>
                        <div className="bg-card overflow-x-auto border">
                            <table className="w-full font-mono text-[11.5px]">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-3 py-2 text-left text-[10px] tracking-widest uppercase">
                                            reason
                                        </th>
                                        <th className="px-3 py-2 text-left text-[10px] tracking-widest uppercase">
                                            http
                                        </th>
                                        <th className="px-3 py-2 text-left text-[10px] tracking-widest uppercase">
                                            meaning
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => (
                                        <tr
                                            key={r.id}
                                            className="hover:bg-muted/30 border-b last:border-b-0"
                                        >
                                            <td className="px-3 py-2 align-top">
                                                <code>{r.id}</code>
                                            </td>
                                            <td className="text-muted-foreground px-3 py-2 align-top tabular-nums">
                                                {r.status}
                                            </td>
                                            <td className="text-foreground/90 px-3 py-2 align-top">
                                                {r.description}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
            <p className="text-muted-foreground/70 text-[10.5px]">
                {reasons.length} reasons · auto-generated from{' '}
                <a href="https://fleet.ochk.io/api/reasons" className="underline">
                    /api/reasons
                </a>{' '}
                at build time. Source of truth: <code>src/server/api/reasons.ts</code> in{' '}
                <a href="https://github.com/orangecheck/oc-fleet-web" className="underline">
                    orangecheck/oc-fleet-web
                </a>
                .
            </p>
        </div>
    );
}
