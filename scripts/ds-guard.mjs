#!/usr/bin/env node
/**
 * Design-system guard. The docs are on @orangecheck/app-design, and a page
 * mixing systems breaks: app-design's tokens apply under data-oc-app="ochk"
 * on <html>, so a classic component renders in the wrong colours and its
 * dialogs portal outside any wrapper. Fails if:
 *   - @orangecheck/ui (deprecated) is a dependency or imported;
 *   - anything from the classic @orangecheck/design is imported, except its
 *     Swagger UI stylesheet, which app-design does not ship yet.
 * Runs before `type-check` (the pretype-check hook).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ALLOWED = new Set(['@orangecheck/design/styles/swagger.css']);
const IMPORT =
    /(?:from\s+|import\s+|import\(\s*|require\(\s*)['"](@orangecheck\/(?:ui|design)(?:\/[^'"]*)?)['"]/g;

function walk(dir, out = []) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) {
            // Generated SDK pages quote package names in prose and code.
            if (p !== join('src', 'pages', 'sdk')) walk(p, out);
        } else if (/\.(ts|tsx|js|jsx|mjs|css)$/.test(name)) out.push(p);
    }
    return out;
}

const bad = [];
for (const file of [...walk('src'), 'next.config.ts']) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(IMPORT)) {
        if (!ALLOWED.has(m[1])) bad.push(`    ${file}: ${m[1]}`);
    }
}
if (/"@orangecheck\/ui"\s*:/.test(readFileSync('package.json', 'utf8'))) {
    bad.push('    package.json: @orangecheck/ui is a dependency');
}

if (bad.length) {
    console.error(
        '✗ design-system guard: the docs use @orangecheck/app-design only.\n' +
            bad.join('\n') +
            '\n  → import from @orangecheck/app-design; add what it lacks to the package.'
    );
    process.exit(1);
}
console.log('✓ design-system guard: app-design only (classic: swagger.css alone)');
