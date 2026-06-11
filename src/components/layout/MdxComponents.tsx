import type { MDXComponents } from 'mdx/types';

import dynamic from 'next/dynamic';
import NextLink from 'next/link';
import React, { isValidElement } from 'react';

import { cn } from '@/lib/utils/utils';

import { SpecRef } from '@/components/docs/SpecRef';

// Mermaid renders its SVG client-side (dynamic `import('mermaid')` + DOM
// injection), so server-rendering it produces output that never matches the
// client — a React #418 hydration mismatch on any page with a diagram (the
// homepage). Loading it ssr:false keeps it out of SSR/hydration entirely; it
// mounts on the client after a stable placeholder, so there is nothing to
// mismatch. The placeholder mirrors the pre-render <pre> so there's no jump.
const Mermaid = dynamic(() => import('@/components/docs/Mermaid').then((m) => m.Mermaid), {
    ssr: false,
    loading: () => (
        <figure className="my-6 overflow-x-auto rounded-lg border bg-zinc-950/40 p-4">
            <pre className="text-muted-foreground overflow-x-auto font-mono text-xs">
                rendering diagram…
            </pre>
        </figure>
    ),
});

// MDX content is constrained by DocsLayout's center column; no wrapper.
const MDXWrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

/**
 * Pull the raw text out of an MDX `<pre><code>…</code></pre>` block. MDX
 * gives us a `<code>` element whose `children` is either a string or an
 * array of strings (when the highlighter splits tokens). Either way we
 * just want the source for the Mermaid renderer.
 */
function readCodeSource(child: React.ReactNode): string | null {
    if (!isValidElement(child)) return null;
    const props = child.props as { children?: React.ReactNode };
    const c = props.children;
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) return c.filter((x) => typeof x === 'string').join('');
    return null;
}

function getCodeLang(child: React.ReactNode): string | null {
    if (!isValidElement(child)) return null;
    const props = child.props as { className?: string };
    const cls = props.className || '';
    const m = cls.match(/language-([a-zA-Z0-9_-]+)/);
    return m ? m[1] : null;
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        wrapper: MDXWrapper,
        SpecRef,

        h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
            <h1
                className={cn(
                    'mb-6 text-3xl font-semibold tracking-tight md:text-4xl',
                    props.className
                )}
                {...props}
            />
        ),
        h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
            <h2 className={cn('mt-10 mb-3 text-2xl font-semibold', props.className)} {...props} />
        ),
        h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
            <h3 className={cn('mt-8 mb-2 text-xl font-medium', props.className)} {...props} />
        ),
        h4: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
            <h4 className={cn('mt-4 mb-2 text-lg font-medium', props.className)} {...props} />
        ),
        p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
            <p className={cn('text-muted-foreground mb-5 leading-7', props.className)} {...props} />
        ),
        ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
            <ul
                className={cn('mb-5 ml-0 list-inside list-disc space-y-2', props.className)}
                {...props}
            />
        ),
        ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
            <ol
                className={cn('mb-5 ml-0 list-inside list-decimal space-y-2', props.className)}
                {...props}
            />
        ),
        li: (props: React.HTMLAttributes<HTMLLIElement>) => (
            <li className={cn('text-muted-foreground', props.className)} {...props} />
        ),
        code: (props: React.HTMLAttributes<HTMLElement>) => (
            <code
                className={cn('bg-muted rounded px-2 py-1 font-mono text-sm', props.className)}
                {...props}
            />
        ),
        pre: (props: React.HTMLAttributes<HTMLPreElement>) => {
            // MDX wraps every fenced code block in <pre><code class="language-…">.
            // Intercept ```mermaid``` fences and render them as proper diagrams
            // — ASCII art is for grep, not docs.
            const child = React.Children.toArray(props.children)[0];
            const lang = getCodeLang(child);
            if (lang === 'mermaid') {
                const src = readCodeSource(child);
                if (src) return <Mermaid chart={src} />;
            }
            return (
                <pre
                    className={cn(
                        'bg-muted mb-5 overflow-x-auto rounded-lg p-4 text-sm',
                        props.className
                    )}
                    {...props}
                />
            );
        },
        blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
            // NOTE: `{...props}` is critical — without it, children is dropped
            // and every `>` blockquote renders as an empty styled box. This
            // was a real regression on the old ochk.io docs site.
            <blockquote
                className={cn(
                    'text-muted-foreground mb-4 border-l-4 border-orange-500 pl-4 italic',
                    props.className
                )}
                {...props}
            />
        ),
        hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
            <hr className="my-8 border-t" {...props} />
        ),
        table: (props: React.TableHTMLAttributes<HTMLTableElement>) => (
            <div className="my-6 w-full overflow-y-auto">
                <table className={cn('w-full', props.className)} {...props} />
            </div>
        ),
        tr: (props: React.HTMLAttributes<HTMLTableRowElement>) => (
            <tr className={cn('even:bg-muted m-0 border-t p-0', props.className)} {...props} />
        ),
        th: (props: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) => (
            <th
                className={cn(
                    'border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right',
                    props.className
                )}
                {...props}
            />
        ),
        td: (props: React.TdHTMLAttributes<HTMLTableDataCellElement>) => (
            <td
                className={cn(
                    'border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right',
                    props.className
                )}
                {...props}
            />
        ),
        a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
            const { children, href, ...rest } = props;
            const url = href || '#';
            const isExternal = /^https?:\/\//.test(url) && !url.startsWith('/');
            return (
                <NextLink
                    href={url}
                    className="text-primary hover:text-primary/80 underline underline-offset-4"
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    {...rest}
                >
                    {children}
                </NextLink>
            );
        },

        ...components,
    };
}
