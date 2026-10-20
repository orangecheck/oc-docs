import type { ApiRow } from '@orangecheck/app-design/components';
import type { ReactElement, ReactNode, TableHTMLAttributes } from 'react';

import { ApiTable, MdxTable } from '@orangecheck/app-design/components';
import { Children, Fragment, isValidElement } from 'react';

/*
 * TypeDoc writes every parameter and property list as a markdown table:
 * `| Property | Type | Description | Defined in |`. Read back here, it
 * becomes an ApiTable: a table on a desk, a card per member on a phone.
 * A table of another shape, or with nothing to say beyond name and type,
 * stays a table.
 */

type Props = { children?: ReactNode; className?: string; id?: string };
const el = (n: ReactNode): n is ReactElement<Props> => isValidElement(n);
const kids = (n: ReactNode) => Children.toArray(n).filter(el);

function textOf(node: ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (Array.isArray(node)) return node.map(textOf).join('');
    if (el(node)) return textOf(node.props.children);
    return '';
}

const NAME = new Set(['Parameter', 'Property', 'Name']);

/** Code in a type or default reads as part of it, not as a pill inside it. */
const plain = (node: ReactNode) => (
    <span className="[&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[1em] [&_code]:text-inherit">
        {node}
    </span>
);

function rowsOf(children: ReactNode): { rows: ApiRow[]; header: string } | null {
    const parts = kids(children);
    const head = parts.find((p) => p.type === 'thead');
    const body = parts.find((p) => p.type === 'tbody');
    if (!head || !body) return null;
    const headers = kids(kids(head.props.children)[0]?.props.children).map((th) =>
        textOf(th.props.children).trim()
    );
    if (!NAME.has(headers[0] ?? '')) return null;
    const col = (h: string) => headers.indexOf(h);
    const [type, desc, def, src] = [
        col('Type'),
        col('Description'),
        col('Default value'),
        col('Defined in'),
    ];
    const notes = (['Modifier', 'Inherited from', 'Overrides'] as const)
        .map((h) => [h, col(h)] as const)
        .filter(([, i]) => i >= 0);
    if (type < 0 || (desc < 0 && def < 0 && src < 0)) return null;
    const rows = kids(body.props.children).map((tr): ApiRow => {
        const cells = kids(tr.props.children).map((td) => td.props.children);
        const name = Children.toArray(cells[0]);
        // TypeDoc links to a member as #property-x: the row is the anchor.
        const anchor = name.find((n) => el(n) && n.props.id);
        const extra = notes
            .map(([h, i]) => (textOf(cells[i]).trim() ? [h, cells[i]] : null))
            .filter((x): x is [string, ReactNode] => x !== null);
        // TypeDoc writes "-" where a member has no description.
        const said = desc >= 0 && textOf(cells[desc]).trim() !== '-';
        return {
            name: textOf(name.filter((n) => n !== anchor)).trim(),
            id: anchor && el(anchor) ? anchor.props.id : undefined,
            type: plain(cells[type]),
            default: def >= 0 && textOf(cells[def]).trim() ? plain(cells[def]) : undefined,
            source: src >= 0 && textOf(cells[src]).trim() ? cells[src] : undefined,
            description:
                said || extra.length ? (
                    <>
                        {said ? cells[desc] : null}
                        {extra.length ? (
                            <span className="text-muted-foreground mt-1 block text-[0.8125rem] first:mt-0">
                                {extra.map(([h, v], i) => (
                                    <Fragment key={h}>
                                        {i > 0 ? ' · ' : null}
                                        {h} {v}
                                    </Fragment>
                                ))}
                            </span>
                        ) : null}
                    </>
                ) : undefined,
        };
    });
    return { rows, header: headers[0]! };
}

/** A markdown table; on a generated SDK page, an ApiTable when it lists members. */
export function TypedocTable({
    sdk,
    ...props
}: TableHTMLAttributes<HTMLTableElement> & { sdk: boolean }) {
    const api = sdk ? rowsOf(props.children) : null;
    if (!api) return <MdxTable {...props} />;
    return <ApiTable rows={api.rows} nameHeader={api.header} />;
}
