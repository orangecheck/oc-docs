import { fileURLToPath } from 'node:url';

import { appDesignVitest } from '@orangecheck/app-design/vitest';
import { defineConfig } from 'vitest/config';

// app-design's aliases for next/link and next/router, and the package inlined, so a test can render its chrome.
const appDesign = appDesignVitest(fileURLToPath(new URL('.', import.meta.url)));

export default defineConfig({
    resolve: {
        alias: {
            ...appDesign.resolve.alias,
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
        globals: false,
        server: appDesign.test.server,
    },
});
