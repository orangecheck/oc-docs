'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '@/lib/utils/utils';

/**
 * <Mermaid> — client-side renderer for Mermaid graph definitions in MDX.
 *
 * MDX ` ```mermaid ` fences route through MdxComponents.pre, which forwards
 * the raw source to this component. We dynamically import `mermaid` so its
 * ~600 KB bundle only loads on pages that need it; pages without diagrams
 * pay no cost.
 *
 * Theme: forced `dark` so the diagram blends with the docs dark theme;
 * we override the palette to the OrangeCheck primary.
 */
interface MermaidProps {
    chart: string;
    className?: string;
}

let mermaidLoader: Promise<typeof import('mermaid').default> | null = null;

function loadMermaid(): Promise<typeof import('mermaid').default> {
    if (!mermaidLoader) {
        mermaidLoader = import('mermaid').then((m) => {
            const mermaid = m.default;
            mermaid.initialize({
                startOnLoad: false,
                theme: 'base',
                securityLevel: 'strict',
                fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                themeVariables: {
                    background: 'transparent',
                    primaryColor: '#1f1f1f',
                    primaryTextColor: '#fafafa',
                    primaryBorderColor: '#f97316',
                    lineColor: '#71717a',
                    secondaryColor: '#27272a',
                    tertiaryColor: '#18181b',
                    nodeBorder: '#f97316',
                    clusterBkg: '#0a0a0a',
                    clusterBorder: '#3f3f46',
                    titleColor: '#fafafa',
                    edgeLabelBackground: '#0a0a0a',
                    fontSize: '13px',
                },
                flowchart: { htmlLabels: true, curve: 'basis', padding: 12 },
                sequence: { actorMargin: 50, mirrorActors: false },
            });
            return mermaid;
        });
    }
    return mermaidLoader;
}

export function Mermaid({ chart, className }: MermaidProps) {
    const id = useId().replace(/:/g, '');
    const [svg, setSvg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let cancelled = false;
        loadMermaid()
            .then(async (mermaid) => {
                try {
                    const { svg } = await mermaid.render(`m-${id}`, chart);
                    if (!cancelled) setSvg(svg);
                } catch (e) {
                    if (!cancelled) {
                        setErr(e instanceof Error ? e.message : String(e));
                    }
                }
            })
            .catch((e) => {
                if (!cancelled) setErr(String(e));
            });
        return () => {
            cancelled = true;
        };
    }, [chart, id]);

    if (err) {
        return (
            <div className="border-destructive/40 bg-destructive/5 my-6 border p-4 font-mono text-xs">
                <div className="text-destructive mb-2 font-bold tracking-widest uppercase">
                    mermaid render error
                </div>
                <pre className="whitespace-pre-wrap">{err}</pre>
                <details className="mt-3 cursor-pointer">
                    <summary className="text-muted-foreground">show source</summary>
                    <pre className="mt-2 whitespace-pre-wrap">{chart}</pre>
                </details>
            </div>
        );
    }

    return (
        <figure
            className={cn('my-6 overflow-x-auto rounded-lg border bg-zinc-950/40 p-4', className)}
        >
            {svg ? (
                <div
                    ref={ref}
                    className="mermaid-host flex justify-center"
                    dangerouslySetInnerHTML={{ __html: svg }}
                />
            ) : (
                <pre className="text-muted-foreground overflow-x-auto font-mono text-xs">
                    {chart}
                </pre>
            )}
        </figure>
    );
}
