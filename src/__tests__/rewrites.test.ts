// @vitest-environment node
import { externalRewrites } from '@orangecheck/site-kit/rewrites';
import { describe, expect, it } from 'vitest';

import nextConfig from '../../next.config';

// A rewrite to another origin sends the visitor's request on, cookies included.
describe('next.config rewrites', () => {
    it('send nothing to another origin', async () => {
        expect(await externalRewrites(nextConfig)).toEqual([]);
    });
});
