import { evaluate } from '@mdx-js/mdx';
import * as runtime from 'react/jsx-runtime';
import rehypeSlug from 'rehype-slug';
import { describe, expect, it } from 'vitest';

import { recmaToc, rehypeToc } from './mdx-toc.mjs';

async function tocOf(source: string) {
    const page = await evaluate(source, {
        ...runtime,
        rehypePlugins: [rehypeSlug, rehypeToc],
        recmaPlugins: [recmaToc],
    });
    return (page.default as { toc?: unknown }).toc;
}

describe('the build-time "On this page" list', () => {
    it('lists the h2 and h3 headings by the ids rehype-slug gives them', async () => {
        expect(
            await tocOf('# Title\n\n## First part\n\ntext\n\n### A `detail`\n\n## Second')
        ).toEqual([
            { id: 'first-part', label: 'First part', level: 2 },
            { id: 'a-detail', label: 'A detail', level: 3 },
            { id: 'second', label: 'Second', level: 2 },
        ]);
    });

    it('leaves a page with no sections without a list', async () => {
        expect(await tocOf('# Title\n\nJust prose.')).toBeUndefined();
    });
});
