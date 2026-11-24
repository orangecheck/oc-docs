import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const src = (f: string) => readFileSync(join(__dirname, '..', f), 'utf8');

// The key a project registers signs its own trust statements; receipts carry
// orangecheck's signature alone, so nothing is co-signed with it.
describe("what the docs call a project's own key", () => {
    it('names it as ochk.app does, never as a co-signing key', () => {
        const api = src('pages/me/api.mdx').replace(/\s+/g, ' ');
        expect(api).toContain('registering a project signing key');
        expect(api).toContain("**Project signing key** on the project's keys page on ochk.app");
        expect(api).not.toMatch(/co-sign/i);
    });
});
