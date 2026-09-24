/**
 * Check every `@orangecheck/*` import in the docs against what the published
 * package actually exports, and every `@orangecheck/*` name against npm.
 *
 * Why: samples imported from `@orangecheck/pledge` (never published), called
 * `sign` from wallet-adapter (it exports getSigner), and named packages such
 * as `@orangecheck/agent-client` that do not exist. None of that is visible to
 * the build: a code fence is text to MDX, tsc and Prettier alike.
 *
 * It installs the latest of each imported package into a temp dir and asks
 * the TypeScript checker for the module's exports, so type-only names
 * (interfaces, type aliases) count as exports too.
 *
 * Fails on: a name that is not an npm package; an import from a deprecated
 * package; an imported name the package does not export.
 *
 * Usage: node scripts/check-sample-imports.mjs   (needs network)
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import ts from 'typescript';

const PAGES = 'src/pages';
// Generated TypeDoc pages quote the package's own JSDoc; oc-packages owns those.
const GENERATED = /^src\/pages\/sdk\/[^/]+\//;

function walk(dir) {
    const out = [];
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) out.push(...walk(p));
        else if (/\.(mdx|md|tsx)$/.test(name)) out.push(p);
    }
    return out;
}

const IMPORT_RE =
    /import\s+(type\s+)?([\w$]+\s*,?\s*)?(\*\s+as\s+[\w$]+|\{[^}]*\})?\s*from\s+['"](@orangecheck\/[^'"]+)['"]/g;
// A trailing `-` or `*` is a family glob in prose (`@orangecheck/lock-*`), not a name.
const NAME_RE = /@orangecheck\/([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)(?![\w*-])/g;

const imports = []; // { file, line, spec, names }
const mentions = new Map(); // package -> Set(file)
for (const file of walk(PAGES)) {
    if (GENERATED.test(file)) continue;
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(NAME_RE)) {
        const pkg = `@orangecheck/${m[1]}`;
        if (!mentions.has(pkg)) mentions.set(pkg, new Set());
        mentions.get(pkg).add(file);
    }
    for (const m of text.matchAll(IMPORT_RE)) {
        const [, , def, rest, spec] = m;
        const names = [];
        if (def && def.replace(',', '').trim()) names.push('default');
        if (rest?.startsWith('{')) {
            const body = rest.slice(1, -1).replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '');
            for (const part of body.split(',')) {
                const n = part
                    .trim()
                    .replace(/^type\s+/, '')
                    .split(/\s+as\s+/)[0]
                    .trim();
                if (n) names.push(n);
            }
        }
        const line = text.slice(0, m.index).split('\n').length;
        imports.push({ file, line, spec, names });
    }
}

const failures = [];

// 1. Every named package must be on npm; imports must not use deprecated ones.
const meta = new Map();
for (const pkg of [...mentions.keys()].sort()) {
    const res = await fetch(`https://registry.npmjs.org/${pkg.replace('/', '%2f')}`);
    if (res.status === 404) {
        for (const f of mentions.get(pkg)) failures.push(`${f}  ${pkg}  (not a published package)`);
        continue;
    }
    if (!res.ok) throw new Error(`registry ${res.status} for ${pkg}`);
    const doc = await res.json();
    const latest = doc['dist-tags'].latest;
    meta.set(pkg, { latest, deprecated: doc.versions[latest]?.deprecated });
}

const pkgOf = (spec) => spec.split('/').slice(0, 2).join('/');
const usable = imports.filter((i) => meta.has(pkgOf(i.spec)));
for (const i of usable) {
    if (meta.get(pkgOf(i.spec)).deprecated) {
        failures.push(
            `${i.file}:${i.line}  ${pkgOf(i.spec)}  (deprecated on npm; do not teach it)`
        );
    }
}

// 2. Install what the samples import and read each module's exports.
const pkgs = [...new Set(usable.map((i) => pkgOf(i.spec)))];
const dir = mkdtempSync(join(tmpdir(), 'oc-docs-samples-'));
try {
    writeFileSync(join(dir, 'package.json'), '{"private":true}');
    const args = [
        'install',
        '--no-audit',
        '--no-fund',
        '--ignore-scripts',
        '--legacy-peer-deps',
        '--prefer-online', // the version comes from a fresh registry read; don't resolve it from a stale cache
        ...pkgs.map((p) => `${p}@${meta.get(p).latest}`),
    ];
    // A version published seconds ago can still be missing from a registry
    // replica (ETARGET), so a release racing this check retries.
    for (let attempt = 1; ; attempt++) {
        try {
            execFileSync('npm', args, { cwd: dir, stdio: ['ignore', 'ignore', 'inherit'] });
            break;
        } catch (err) {
            if (attempt === 4) throw err;
            await new Promise((r) => setTimeout(r, 15_000 * attempt));
        }
    }

    const specs = [...new Set(usable.map((i) => i.spec))];
    const entry = join(dir, 'entry.ts');
    writeFileSync(entry, specs.map((s, n) => `import * as m${n} from '${s}';`).join('\n'));
    const program = ts.createProgram([entry], {
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        skipLibCheck: true,
        noEmit: true,
    });
    const checker = program.getTypeChecker();
    const exportsOf = new Map();
    for (const stmt of program.getSourceFile(entry).statements) {
        const spec = stmt.moduleSpecifier.text;
        const sym = checker.getSymbolAtLocation(stmt.moduleSpecifier);
        exportsOf.set(
            spec,
            sym ? new Set(checker.getExportsOfModule(sym).map((e) => e.escapedName)) : null
        );
    }

    for (const i of usable) {
        const exported = exportsOf.get(i.spec);
        if (!exported) {
            failures.push(`${i.file}:${i.line}  ${i.spec}  (module does not resolve)`);
            continue;
        }
        for (const n of i.names) {
            if (!exported.has(n)) {
                const v = meta.get(pkgOf(i.spec)).latest;
                failures.push(`${i.file}:${i.line}  ${n} from ${i.spec}  (not exported by ${v})`);
            }
        }
    }
} finally {
    rmSync(dir, { recursive: true, force: true });
}

console.log(
    `sample imports: ${imports.length} imports, ${mentions.size} packages · ${failures.length} problems`
);
for (const f of failures) console.log(`  ${f}`);
if (failures.length > 0) process.exitCode = 1;
