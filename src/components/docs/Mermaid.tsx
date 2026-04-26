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
            const text = '#fafafa';
            const muted = '#a1a1aa';
            const line = '#71717a';
            const orange = '#f97316';
            const bg0 = '#0a0a0a';
            const bg1 = '#18181b';
            const bg2 = '#27272a';
            const border = '#3f3f46';
            mermaid.initialize({
                startOnLoad: false,
                theme: 'base',
                securityLevel: 'strict',
                fontFamily:
                    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                themeVariables: {
                    // generic
                    background: 'transparent',
                    fontSize: '13px',
                    textColor: text,
                    mainBkg: bg1,
                    secondBkg: bg2,
                    tertiaryColor: bg0,

                    // primary / secondary / tertiary node tiers
                    primaryColor: bg1,
                    primaryTextColor: text,
                    primaryBorderColor: orange,
                    secondaryColor: bg2,
                    secondaryTextColor: text,
                    secondaryBorderColor: border,
                    tertiaryTextColor: text,
                    tertiaryBorderColor: border,

                    // edges, clusters, edge labels
                    lineColor: line,
                    edgeLabelBackground: bg0,
                    nodeBorder: orange,
                    clusterBkg: bg0,
                    clusterBorder: border,
                    titleColor: text,

                    // notes
                    noteBkgColor: bg2,
                    noteTextColor: text,
                    noteBorderColor: border,

                    // sequence diagram (was unstyled — base theme defaulted to dark
                    // text on light bg, illegible on our dark page)
                    actorBkg: bg1,
                    actorBorder: orange,
                    actorTextColor: text,
                    actorLineColor: line,
                    signalColor: text,
                    signalTextColor: text,
                    labelBoxBkgColor: bg2,
                    labelBoxBorderColor: border,
                    labelTextColor: text,
                    loopTextColor: text,
                    activationBkgColor: border,
                    activationBorderColor: line,
                    sequenceNumberColor: bg0,
                    altBackground: bg0,
                },
                themeCSS: `
                    .nodeLabel, .nodeLabel p, .label foreignObject div { color: ${text} !important; }
                    .edgeLabel, .edgeLabel p, .edgeLabel rect { color: ${text} !important; background-color: ${bg0} !important; fill: ${bg0} !important; }
                    .messageText, .actor text, .loopText, .noteText, .labelText { fill: ${text} !important; }
                    .actor { stroke: ${orange} !important; }
                    .messageLine0, .messageLine1 { stroke: ${muted} !important; }
                    .cluster rect { fill: ${bg0} !important; stroke: ${border} !important; }
                `,
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
