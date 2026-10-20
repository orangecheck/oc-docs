/** JSON for an inline script, with `<` escaped so no value can close the tag. */
export function jsonLd(data: unknown): string {
    return JSON.stringify(data).replace(/</g, '\\u003c');
}
