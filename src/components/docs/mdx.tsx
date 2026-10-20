import type { MDXComponents } from 'mdx/types';
import type {
    AnchorHTMLAttributes,
    HTMLAttributes,
    InputHTMLAttributes,
    TableHTMLAttributes,
} from 'react';

import { createMdxComponents } from '@orangecheck/app-design/mdx';
import { cn } from '@orangecheck/app-design/primitives';
import { useRouter } from 'next/router';

import { SpecRef } from '@/components/docs/SpecRef';
import { TypedocTable } from '@/components/docs/TypedocTable';

/*
 * Markdown in the family's type: app-design's map, plus what these docs
 * write that it does not cover. Mermaid loads only on a page with a diagram.
 */
const base = createMdxComponents({ mermaid: () => import('mermaid') });

const SCHEME = /^[a-z][a-z\d+.-]*:/i;

/**
 * TypeDoc's pages link relative to themselves (`../README`, `VerifyOk`).
 * Resolved against this page, they go through the router like every other
 * page link, and pick up the base path.
 */
function resolve(href: string | undefined, asPath: string): string | undefined {
    if (!href || href.startsWith('#') || href.startsWith('/') || SCHEME.test(href)) return href;
    const here = asPath.split(/[?#]/)[0] || '/';
    const url = new URL(href, `https://docs.invalid${here}`);
    return url.pathname + url.search + url.hash;
}

function A(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
    const { asPath } = useRouter();
    const Base = base.a;
    return <Base {...props} href={resolve(props.href, asPath)} />;
}

/** A generated SDK page's member lists read as ApiTables; every other table as itself. */
function Table(props: TableHTMLAttributes<HTMLTableElement>) {
    const { asPath } = useRouter();
    return <TypedocTable {...props} sdk={/^\/sdk\/[^/]+\//.test(asPath)} />;
}

// TypeDoc writes h5 for a method's "Returns"; the system's map stops at h4.
const minor = (Tag: 'h5' | 'h6') =>
    function Minor({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
        return (
            <Tag
                className={cn(
                    'text-foreground mt-6 mb-2 scroll-mt-28 text-[0.9375rem] leading-snug font-medium',
                    className
                )}
                {...props}
            />
        );
    };

// A GitHub task list: the box replaces the bullet.
function Ul(props: HTMLAttributes<HTMLUListElement>) {
    const Base = base.ul;
    const tasks = props.className?.includes('contains-task-list');
    return <Base {...props} className={cn(props.className, tasks && 'list-none pl-0')} />;
}

function Li(props: HTMLAttributes<HTMLLIElement>) {
    const Base = base.li;
    const task = props.className?.includes('task-list-item');
    // A wrapped line starts under the text, not under the box.
    return <Base {...props} className={cn(props.className, task && 'pl-6 -indent-6')} />;
}

function Input(props: InputHTMLAttributes<HTMLInputElement>) {
    if (props.type !== 'checkbox') return <input {...props} />;
    return (
        <input
            {...props}
            className="accent-foreground mr-2 size-4 translate-y-[2px] align-baseline"
            aria-label={props.checked ? 'Done' : 'To do'}
        />
    );
}

export const docsMdxComponents: MDXComponents = {
    ...base,
    a: A,
    table: Table,
    h5: minor('h5'),
    h6: minor('h6'),
    ul: Ul,
    li: Li,
    input: Input,
    SpecRef,
};
