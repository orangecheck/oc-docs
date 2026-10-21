// "On this page" read at build time. DocsShell otherwise reads the headings
// after hydration and inserts the list above the article, which moved every
// docs page down 82px on a phone (CLS 0.075). rehypeToc collects the h2 and
// h3 ids rehype-slug set; recmaToc hangs the list on the page component, where
// _app reads it like `bare`.

function textOf(node) {
    if (node.type === 'text') return node.value;
    return (node.children ?? []).map(textOf).join('');
}

export function rehypeToc() {
    return (tree, file) => {
        const toc = [];
        const walk = (node) => {
            if (node.type === 'element' && (node.tagName === 'h2' || node.tagName === 'h3')) {
                const id = node.properties?.id;
                if (typeof id === 'string') {
                    toc.push({
                        id,
                        label: textOf(node).trim(),
                        level: node.tagName === 'h3' ? 3 : 2,
                    });
                }
                return;
            }
            for (const child of node.children ?? []) walk(child);
        };
        walk(tree);
        file.data.toc = toc;
    };
}

export function recmaToc() {
    return (program, file) => {
        const toc = file.data.toc;
        if (!toc?.length) return;
        const json = JSON.stringify(toc);
        // MDXContent.toc = JSON.parse("[…]"), ahead of the `return` that ends function-body output.
        const end = program.body.findIndex((n) => n.type === 'ReturnStatement');
        program.body.splice(end === -1 ? program.body.length : end, 0, {
            type: 'ExpressionStatement',
            expression: {
                type: 'AssignmentExpression',
                operator: '=',
                left: {
                    type: 'MemberExpression',
                    object: { type: 'Identifier', name: 'MDXContent' },
                    property: { type: 'Identifier', name: 'toc' },
                    computed: false,
                    optional: false,
                },
                right: {
                    type: 'CallExpression',
                    callee: {
                        type: 'MemberExpression',
                        object: { type: 'Identifier', name: 'JSON' },
                        property: { type: 'Identifier', name: 'parse' },
                        computed: false,
                        optional: false,
                    },
                    arguments: [{ type: 'Literal', value: json, raw: JSON.stringify(json) }],
                    optional: false,
                },
            },
        });
    };
}
