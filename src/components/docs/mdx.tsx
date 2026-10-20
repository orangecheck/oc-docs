import type { MDXComponents } from 'mdx/types';
import type { TableHTMLAttributes } from 'react';

import { createMdxComponents } from '@orangecheck/app-design/mdx';
import { useRouter } from 'next/router';

import { TypedocTable } from '@/components/docs/TypedocTable';

/*
 * Markdown in the family's type: app-design's map, plus the generated SDK
 * pages' member tables. Mermaid loads only on a page with a diagram.
 */
const base = createMdxComponents({ mermaid: () => import('mermaid') });

/** A generated SDK page's member lists read as ApiTables; every other table as itself. */
function Table(props: TableHTMLAttributes<HTMLTableElement>) {
    const { asPath } = useRouter();
    return <TypedocTable {...props} sdk={/^\/sdk\/[^/]+\//.test(asPath)} />;
}

export const docsMdxComponents: MDXComponents = {
    ...base,
    table: Table,
};
