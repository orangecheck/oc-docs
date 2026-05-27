#!/usr/bin/env node
/**
 * Design-system drift guard (Phase 4 of the convergence program).
 * Fails if @orangecheck/ui — deprecated, folded into @orangecheck/design —
 * is re-introduced as a dependency or imported anywhere in src.
 * See CLAUDE.md "Design system" + DESIGN-SYSTEM-CONVERGENCE.md.
 * Runs automatically before `type-check` (yarn pretype-check hook).
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

let bad = false;

try {
    const out = execSync(
        `grep -rIlE "from ['\\"]@orangecheck/ui['\\"]" src --include=*.ts --include=*.tsx 2>/dev/null || true`,
        { encoding: 'utf8' }
    ).trim();
    if (out) {
        console.error(
            '✗ design-system drift: `@orangecheck/ui` imported in:\n' +
                out
                    .split('\n')
                    .map((f) => '    ' + f)
                    .join('\n') +
                '\n  → import composites/chrome from `@orangecheck/design` (see CLAUDE.md).'
        );
        bad = true;
    }
} catch {}

try {
    if (
        existsSync('package.json') &&
        /"@orangecheck\/ui"\s*:/.test(readFileSync('package.json', 'utf8'))
    ) {
        console.error(
            '✗ design-system drift: `@orangecheck/ui` is a dependency in package.json.\n' +
                '  → it is folded into `@orangecheck/design`; remove the dep.'
        );
        bad = true;
    }
} catch {}

if (bad) process.exit(1);
console.log('✓ design-system drift guard: clean (no @orangecheck/ui)');
