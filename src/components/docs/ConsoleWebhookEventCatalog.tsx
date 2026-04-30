/**
 * Renders the console.ochk.io subscribable webhook event catalog.
 *
 * Source: src/generated/console-catalogs.json (built from
 * https://console.ochk.io/api/webhook-events at deploy time). The
 * typed source of truth is src/lib/webhooks/events.ts in
 * oc-console-web. Coverage tests over there guarantee every
 * dispatchEvent() call uses an id from this catalog.
 */
import catalogs from '@/generated/console-catalogs.json';

interface WebhookEventEntry {
    id: string;
    description: string;
    payloadFields: string[];
}

export function ConsoleWebhookEventCatalog() {
    const events = (catalogs.webhookEvents ?? []) as WebhookEventEntry[];

    if (events.length === 0) {
        return (
            <div className="text-muted-foreground my-6 rounded border border-dashed p-4 text-sm">
                Catalog not available — the build-time fetch from
                <code className="mx-1">https://console.ochk.io/api/webhook-events</code>
                returned empty. Refresh once the endpoint deploys.
            </div>
        );
    }

    return (
        <div className="my-6 space-y-4">
            <div className="bg-card overflow-x-auto border">
                <table className="w-full font-mono text-[11.5px]">
                    <thead>
                        <tr className="border-b">
                            <th className="px-3 py-2 text-left text-[10px] tracking-widest uppercase">
                                event_type
                            </th>
                            <th className="px-3 py-2 text-left text-[10px] tracking-widest uppercase">
                                meaning + payload top-level fields
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {events.map((e) => (
                            <tr key={e.id} className="hover:bg-muted/30 border-b last:border-b-0">
                                <td className="px-3 py-2 align-top">
                                    <code>{e.id}</code>
                                </td>
                                <td className="px-3 py-2 align-top">
                                    <p className="text-foreground/90">{e.description}</p>
                                    {e.payloadFields && e.payloadFields.length > 0 && (
                                        <p className="text-muted-foreground/80 mt-1.5 text-[10.5px]">
                                            payload:{' '}
                                            {e.payloadFields.map((f, i) => (
                                                <span key={f}>
                                                    <code>{f}</code>
                                                    {i < e.payloadFields.length - 1 ? ' · ' : ''}
                                                </span>
                                            ))}
                                        </p>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <p className="text-muted-foreground/70 text-[10.5px]">
                {events.length} subscribable event types · auto-generated from{' '}
                <a href="https://console.ochk.io/api/webhook-events" className="underline">
                    /api/webhook-events
                </a>{' '}
                at build time. Source of truth: <code>src/lib/webhooks/events.ts</code> in{' '}
                <a href="https://github.com/orangecheck/oc-console-web" className="underline">
                    orangecheck/oc-console-web
                </a>
                .
            </p>
        </div>
    );
}
