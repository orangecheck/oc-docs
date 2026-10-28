// The family's local ESLint rules for react-hooks disable comments (oc-claude lint-gate.md, react-hooks ratchet).
// Copied identically into every repo; no package, no release. scripts/lint-guards.mjs covers what a rule can't.

/** A directive or inline config in one comment: { kind, rules } or null. */
function directive(comment) {
    const text = comment.value.trim();
    const d =
        /^(eslint-disable-next-line|eslint-disable-line|eslint-disable|eslint-enable)(?=\s|$)([\s\S]*)$/.exec(
            text
        );
    if (d) {
        const rules = d[2]
            .split(/\s--\s|^--\s?/)[0]
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        return { kind: d[1], rules };
    }
    const c = /^eslint\s+([\s\S]+)$/.exec(text);
    if (c && comment.type === 'Block')
        return {
            kind: 'config',
            rules: [...c[1].matchAll(/([@\w-]+\/[\w-]+)\s*:/g)].map((x) => x[1]),
        };
    return null;
}

const isHooks = (r) => r.startsWith('react-hooks/');

const comments = (context) => (context.sourceCode ?? context.getSourceCode()).getAllComments();

/** Next-line disables naming react-hooks rules, and inline configs: today's kept disables are bulk-suppressed under this rule. */
const noReactHooksDisable = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Report each react-hooks rule a disable comment or inline config turns off.',
        },
        schema: [],
        messages: {
            named: 'A disable comment for {{rule}}. A kept one needs a "-- reason"; a new one is a rise in eslint-suppressions.json.',
            config: 'An inline config sets {{rule}}. Rule levels live in eslint.config.mjs.',
        },
    },
    create(context) {
        return {
            Program() {
                for (const c of comments(context)) {
                    const d = directive(c);
                    if (!d) continue;
                    if (d.kind === 'config') {
                        for (const rule of d.rules.filter(isHooks))
                            context.report({ loc: c.loc, messageId: 'config', data: { rule } });
                    } else if (d.kind === 'eslint-disable-next-line') {
                        for (const rule of d.rules.filter(isHooks))
                            context.report({ loc: c.loc, messageId: 'named', data: { rule } });
                    }
                }
            },
        };
    },
};

/**
 * Regions, same-line disables, lists, and a bare next-line, which widen a react-hooks disable.
 * Never bulk-suppressed: none exist. A bare next-line is here because, held under the first
 * rule, a named one could turn bare at the same count and silence every rule.
 */
const noReactHooksDisableWide = {
    meta: {
        type: 'problem',
        docs: {
            description:
                'Refuse react-hooks disables that reach past one line, carry other rules, or name none.',
        },
        schema: [],
        messages: {
            region: 'An eslint-disable region turns off {{rule}} for everything below it. Disable one line, with a reason.',
            line: 'An eslint-disable-line for {{rule}}. Use eslint-disable-next-line, with a reason.',
            list: 'A disable comment names {{rule}} with other rules. Give each its own comment.',
            bare: 'A bare eslint-disable-next-line silences every rule, react-hooks among them. Name the rule and give a reason.',
        },
    },
    create(context) {
        return {
            Program() {
                for (const c of comments(context)) {
                    const d = directive(c);
                    if (!d || d.kind === 'config' || d.kind === 'eslint-enable') continue;
                    if (d.kind === 'eslint-disable-next-line' && d.rules.length === 0) {
                        context.report({ loc: c.loc, messageId: 'bare' });
                        continue;
                    }
                    const hooks = d.rules.filter(isHooks);
                    if (hooks.length === 0) continue;
                    const messageId =
                        d.kind === 'eslint-disable'
                            ? 'region'
                            : d.kind === 'eslint-disable-line'
                              ? 'line'
                              : null;
                    for (const rule of hooks) {
                        if (messageId) context.report({ loc: c.loc, messageId, data: { rule } });
                        else if (d.rules.length > 1)
                            context.report({ loc: c.loc, messageId: 'list', data: { rule } });
                    }
                }
            },
        };
    },
};

const localRules = {
    meta: { name: 'local' },
    rules: {
        'no-react-hooks-disable': noReactHooksDisable,
        'no-react-hooks-disable-wide': noReactHooksDisableWide,
    },
};

export default localRules;
