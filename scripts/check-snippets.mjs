/**
 * Compile every TypeScript, JavaScript and Python code block in the docs
 * against the packages as published, so an example cannot go stale unseen.
 * Integrators copy these blocks verbatim.
 *
 * A block is checked unless its fence says `no-check` (```ts no-check): a
 * fragment, or a sketch with placeholders, opts out on purpose. Every other
 * block must compile as a file of its own.
 *
 * - TypeScript and JavaScript: the latest `@orangecheck/*` packages and the
 *   third-party modules the blocks import are installed from npm into a temp
 *   dir, never from local source, and every block is type-checked (strict).
 * - Python: the latest `orangecheck` from PyPI goes into a fresh venv. Each
 *   block is compiled, its imports are run, and mypy checks it.
 *
 * Nothing runs against a service: compile, import and type-check only.
 *
 * Usage: node scripts/check-snippets.mjs [--only ts|python] [--page <path part>] [--json out.json]
 *        (needs network and python3)
 *
 * Before a release, check the docs against your local build instead of the
 * published one: SNIPPETS_USE='@orangecheck/me-client=/path/to/me-client.tgz,orangecheck=/path/to/sdk-py'
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import ts from 'typescript';

import { allFences, kindOf, NO_CHECK, pyImports, tsImports } from './snippets.mjs';

const args = process.argv.slice(2);
const opt = (name) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : null);
const ONLY = opt('only');
const PAGE = opt('page'); // check only the pages whose path contains this
const JSON_OUT = opt('json');

/** Types for third-party modules that do not ship their own. */
const TYPES_FOR = {
    express: '@types/express',
    'express-session': '@types/express-session',
    react: '@types/react',
};
/** Local builds to install in place of the published packages (see Usage). */
const USE = Object.fromEntries(
    (process.env.SNIPPETS_USE ?? '')
        .split(',')
        .filter(Boolean)
        .map((pair) => [pair.slice(0, pair.indexOf('=', 1)), pair.slice(pair.indexOf('=', 1) + 1)])
);
/** PyPI names for the modules Python blocks import, where they differ. */
const PYPI_FOR = { jwt: 'PyJWT' };
const PY_STDLIB = new Set(sys_stdlib());
/** Runs only a file's import statements, so an import that does not resolve fails. */
const IMPORTS_ONLY = `
import ast, sys
tree = ast.parse(open(sys.argv[1]).read())
mod = ast.Module(body=[n for n in ast.walk(tree) if isinstance(n, (ast.Import, ast.ImportFrom))], type_ignores=[])
exec(compile(mod, sys.argv[1], 'exec'), {})
`;

const blocks = allFences().filter((b) => kindOf(b) !== 'other' && (!PAGE || b.file.includes(PAGE)));
const checked = blocks.filter((b) => !NO_CHECK.test(b.meta));
const failures = []; // { file, line, kind, code?, message }

const dir = mkdtempSync(join(tmpdir(), 'oc-docs-snippets-'));
try {
    if (ONLY !== 'python') await checkTs(checked.filter((b) => kindOf(b) === 'ts'));
    if (ONLY !== 'ts') checkPython(checked.filter((b) => kindOf(b) === 'python'));
} finally {
    rmSync(dir, { recursive: true, force: true });
}

const marked = blocks.length - checked.length;
console.log(
    `snippets: ${checked.length} checked, ${marked} marked no-check · ${failures.length} problems`
);
for (const f of failures)
    console.log(`  ${f.file}:${f.line}  [${f.kind}${f.code ? ` ${f.code}` : ''}] ${f.message}`);
if (JSON_OUT)
    writeFileSync(JSON_OUT, JSON.stringify({ checked: checked.length, marked, failures }, null, 2));
if (failures.length > 0) process.exitCode = 1;

// ─── TypeScript / JavaScript ────────────────────────────────────────────────

async function checkTs(list) {
    if (list.length === 0) return;
    const bare = (s) => !s.startsWith('.') && !s.startsWith('node:');
    const pkgOf = (s) =>
        s
            .split('/')
            .slice(0, s.startsWith('@') ? 2 : 1)
            .join('/');
    const pkgs = new Set(['@types/node']);
    for (const b of list)
        for (const s of tsImports(b.code).filter(bare)) {
            pkgs.add(pkgOf(s));
            if (TYPES_FOR[pkgOf(s)]) pkgs.add(TYPES_FOR[pkgOf(s)]);
        }
    const specs = [];
    for (const p of [...pkgs].sort()) {
        if (USE[p]) {
            specs.push(USE[p]);
            continue;
        }
        // The latest as npm itself says, so a release racing this check is read
        // from the registry it was published to, not a lagging mirror.
        const res = await fetch(`https://registry.npmjs.org/${p.replace('/', '%2f')}`);
        if (res.status === 404) {
            for (const b of list.filter((x) => tsImports(x.code).some((s) => pkgOf(s) === p)))
                failures.push({
                    file: b.file,
                    line: b.line,
                    kind: 'ts',
                    message: `${p} is not a published package`,
                });
            continue;
        }
        if (!res.ok) throw new Error(`registry ${res.status} for ${p}`);
        specs.push(`${p}@${(await res.json())['dist-tags'].latest}`);
    }
    // A local build's own local dependencies (an unpublished auth-core under a
    // local me-client) go in too, so npm resolves them from the same place.
    for (const [name, spec] of Object.entries(USE))
        if (name.startsWith('@') && !pkgs.has(name)) specs.push(spec);
    console.log(`npm: ${specs.join(' ')}`);
    const ts_dir = join(dir, 'ts');
    mkdirSync(join(ts_dir, 'blocks'), { recursive: true });
    writeFileSync(join(ts_dir, 'package.json'), '{"private":true,"type":"module"}');
    const npmArgs = [
        'install',
        '--no-audit',
        '--no-fund',
        '--ignore-scripts',
        '--legacy-peer-deps',
        '--registry=https://registry.npmjs.org/',
        '--prefer-online',
        ...specs,
    ];
    for (let attempt = 1; ; attempt++) {
        try {
            execFileSync('npm', npmArgs, { cwd: ts_dir, stdio: ['ignore', 'ignore', 'inherit'] });
            break;
        } catch (err) {
            if (attempt === 4) throw err;
            await new Promise((r) => setTimeout(r, 15_000 * attempt));
        }
    }

    const files = new Map(); // path -> block
    list.forEach((b, i) => {
        const ext =
            b.lang === 'tsx' || b.lang === 'jsx'
                ? b.lang
                : /^(js|javascript|mjs)$/.test(b.lang)
                  ? 'js'
                  : 'ts';
        const p = join(ts_dir, 'blocks', `b${i}.${ext}`);
        // Each block is a module of its own, as it would be in the reader's project.
        writeFileSync(p, `${b.code}\nexport {};\n`);
        files.set(p, b);
    });
    const program = ts.createProgram([...files.keys()], {
        strict: true,
        noEmit: true,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        target: ts.ScriptTarget.ES2022,
        lib: ['lib.es2023.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
        jsx: ts.JsxEmit.ReactJSX,
        allowJs: true,
        checkJs: true,
        esModuleInterop: true,
        resolveJsonModule: true,
        skipLibCheck: true,
        types: ['node'],
        typeRoots: [join(ts_dir, 'node_modules', '@types')],
    });
    for (const d of ts.getPreEmitDiagnostics(program)) {
        const b = d.file && files.get(d.file.fileName);
        const message = ts.flattenDiagnosticMessageText(d.messageText, '\n').split('\n')[0];
        if (!b) {
            failures.push({
                file: '(compiler)',
                line: 0,
                kind: 'ts',
                code: `TS${d.code}`,
                message,
            });
            continue;
        }
        const { line } = d.file.getLineAndCharacterOfPosition(d.start ?? 0);
        failures.push({
            file: b.file,
            line: b.line + 1 + line,
            kind: 'ts',
            code: `TS${d.code}`,
            message,
        });
    }
}

// ─── Python ─────────────────────────────────────────────────────────────────

function checkPython(list) {
    if (list.length === 0) return;
    const py_dir = join(dir, 'py');
    mkdirSync(join(py_dir, 'blocks'), { recursive: true });
    const venv = join(py_dir, 'venv');
    const py = join(venv, 'bin', 'python');
    const mods = new Set();
    for (const b of list) for (const m of pyImports(b.code)) if (!PY_STDLIB.has(m)) mods.add(m);
    const reqs = ['mypy', ...[...mods].map((m) => USE[PYPI_FOR[m] ?? m] ?? PYPI_FOR[m] ?? m)];
    const quiet = { stdio: ['ignore', 'ignore', 'inherit'] };
    // A fresh venv: python3's own, or uv's where python3 ships without ensurepip.
    if (spawnSync('python3', ['-m', 'venv', venv]).status === 0) {
        execFileSync(
            py,
            ['-m', 'pip', 'install', '--quiet', '--disable-pip-version-check', ...reqs],
            quiet
        );
    } else {
        execFileSync('uv', ['venv', '--quiet', '--clear', venv], quiet);
        execFileSync('uv', ['pip', 'install', '--quiet', '--python', py, ...reqs], quiet);
    }
    const ver = spawnSync(
        py,
        ['-c', 'import importlib.metadata as m; print(m.version("orangecheck"))'],
        {
            encoding: 'utf8',
        }
    );
    console.log(`pypi: orangecheck==${ver.stdout.trim()} with ${reqs.join(' ')}`);
    list.forEach((b, i) => {
        const file = join(py_dir, 'blocks', `b${i}.py`);
        writeFileSync(file, `${b.code}\n`);
        const fail = (code, message, at = 0) =>
            failures.push({ file: b.file, line: b.line + 1 + at, kind: 'python', code, message });
        // 1. It compiles.
        const comp = spawnSync(py, ['-m', 'py_compile', file], { encoding: 'utf8' });
        if (comp.status !== 0) return fail('compile', lastLine(comp.stderr));
        // 2. Its imports resolve against what is published.
        const imp = spawnSync(py, ['-c', IMPORTS_ONLY, file], { encoding: 'utf8' });
        if (imp.status !== 0) return fail('import', lastLine(imp.stderr));
        // 3. mypy reads it against the package's own types.
        const my = spawnSync(
            py,
            [
                '-m',
                'mypy',
                '--no-error-summary',
                '--ignore-missing-imports',
                '--cache-dir',
                join(py_dir, '.mypy'),
                file,
            ],
            { encoding: 'utf8' }
        );
        for (const l of my.stdout.split('\n').filter((x) => /: error: /.test(x))) {
            const m = /^.*?:(\d+): error: (.*?)(?:\s+\[([\w-]+)\])?$/.exec(l);
            if (m) fail(`mypy ${m[3] ?? ''}`.trim(), m[2], Number(m[1]) - 1);
        }
    });
}

function lastLine(s) {
    return (s.trim().split('\n').pop() ?? '').trim();
}

function sys_stdlib() {
    const r = spawnSync(
        'python3',
        ['-c', 'import sys; print("\\n".join(sorted(sys.stdlib_module_names)))'],
        {
            encoding: 'utf8',
        }
    );
    return r.status === 0 ? r.stdout.split('\n').filter(Boolean) : [];
}
