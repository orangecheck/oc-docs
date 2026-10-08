// Protocol ids break at their hyphen on a phone ("BIP-" / "322"). Wrap each in
// a whitespace-nowrap span; a non-breaking hyphen would change what people copy.
const IDS = /((?:BIP|NIP|bip|nip|kind)-\d+|SHA-256)/g;
const SKIP = new Set(['code', 'pre', 'script', 'style', 'svg', 'kbd']);

function split(value) {
    const parts = value.split(IDS);
    if (parts.length === 1) return null;
    return parts
        .map((part, i) =>
            i % 2 === 1
                ? {
                      type: 'element',
                      tagName: 'span',
                      properties: { className: ['whitespace-nowrap'] },
                      children: [{ type: 'text', value: part }],
                  }
                : { type: 'text', value: part }
        )
        .filter((n) => n.type !== 'text' || n.value !== '');
}

function walk(node) {
    if (!node.children) return;
    if (node.type === 'element' && SKIP.has(node.tagName)) return;
    if (
        (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
        SKIP.has(node.name)
    )
        return;
    const next = [];
    for (const child of node.children) {
        if (child.type === 'text') {
            const parts = split(child.value);
            if (parts) {
                next.push(...parts);
                continue;
            }
        } else {
            walk(child);
        }
        next.push(child);
    }
    node.children = next;
}

export default function rehypeKeepIds() {
    return (tree) => walk(tree);
}
