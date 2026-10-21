// No response carries a caught error's own text: its error, reason and detail fields say our sentence or a code.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..');
// Where a response or a stored reason is built: the API routes and the server code.
const SCOPE = /^(pages\/api\/|lib\/|server\/)/;
// The logger is where an error's text belongs.
const SKIP = /^lib\/logger\/|\.test\.|__tests__|\.d\.ts$/;
const RAW =
    /\(\s*\w+ as Error\)\.message|\b(err|e|error|ex|cause)\??\.message\b|instanceof Error \? \w+\.message|String\(\s*(err|e|error|ex)\s*\)|\b(err|e|error)\.toString\(\)|\$\{\s*(err|e|ex)\s*\}/;
const SINK =
    /json\(|send\(|\b(error|reason|detail|message|msg|note|why|errorMessage)\s*[:=]|`[^`]*\$\{/;
// A thrown message is checked where it is answered; a log line and a comparison send nothing.
const QUIET =
    /\bthrow new \w*Error\(|console\.|\blog(Error|Warn|Info)?\(|\blog\.(error|warn|info|debug)\(|logger\.|\.message\s*(===|!==)|\.test\(\s*\w+\.message|\.message\.(includes|startsWith|match)\(/;
// path:line text → why it may stay.
const ALLOW: Record<string, string> = {};

function files(dir: string): string[] {
    return readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(n) ? [p] : [];
    });
}

describe('error bodies', () => {
    it('no response or stored reason carries a caught error’s own text', () => {
        const hits: string[] = [];
        for (const f of files(SRC)) {
            const rel = relative(SRC, f);
            if (!SCOPE.test(rel) || SKIP.test(rel)) continue;
            readFileSync(f, 'utf8')
                .split('\n')
                .forEach((line, i) => {
                    const t = line.trim();
                    if (t.startsWith('//') || t.startsWith('*') || QUIET.test(t)) return;
                    if (RAW.test(t) && SINK.test(t) && !ALLOW[`${rel}:${t}`])
                        hits.push(`${rel}:${i + 1}: ${t}`);
                });
        }
        expect(hits).toEqual([]);
    });

    it('every allowance still matches a line, so none outlives its reason', () => {
        const stale = Object.keys(ALLOW).filter((k) => {
            const at = k.indexOf(':');
            let text = '';
            try {
                text = readFileSync(join(SRC, k.slice(0, at)), 'utf8');
            } catch {
                return true;
            }
            return !text.split('\n').some((l) => l.trim() === k.slice(at + 1));
        });
        expect(stale).toEqual([]);
    });
});
