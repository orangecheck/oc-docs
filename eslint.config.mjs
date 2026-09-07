/**
 * eslint-config-next 16 ships a native flat config, so FlatCompat is gone.
 * Wrapping the v16 export in FlatCompat throws "Converting circular structure
 * to JSON" — its `plugins.react` self-reference cannot survive the eslintrc
 * schema validator's JSON.stringify. Import the arrays directly instead; this
 * also drops the @eslint/eslintrc dependency.
 */
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
    /**
     * Unused-directive reporting is OFF, and this is not laziness.
     *
     * `eslint --fix` DELETES a disable comment for a rule that is not enabled
     * here. On the first run across the family it stripped four of them in
     * oc-me-web, including turning
     *
     *     {/* eslint-disable-next-line @next/next/no-sync-scripts *\/}
     *
     * in _document.tsx into a bare `{}` — still valid JSX, intent destroyed,
     * and the guard gone if that rule is ever switched on. A directive naming
     * a rule this config does not enable is documentation for whoever enables
     * it, not dead code.
     */
    { linterOptions: { reportUnusedDisableDirectives: 'off' } },
    ...nextCoreWebVitals,
    ...nextTypescript,
    {
        /**
         * `.vercel/**` matters as much as `.next/**`: a local `vercel build`
         * leaves minified bundles there, and without it eslint reports
         * thousands of prefer-const errors in generated chunks — 9,992 in
         * oc-chat-web, every one of them in .vercel/output. A gate that
         * reports ten thousand errors on its first run is a gate nobody
         * adopts.
         */
        ignores: [
            'node_modules/**',
            '.next/**',
            '.vercel/**',
            'out/**',
            'build/**',
            'dist/**',
            'coverage/**',
            '**/*.min.js',
            'next-env.d.ts',
        ],
    },
    {
        /**
         * Scoped to the same glob eslint-config-next registers its plugins
         * for. In flat config a rule is only resolvable where its plugin is
         * in scope, and next's block covers
         * `**\/*.{js,jsx,mjs,ts,tsx,mts,cts}` — note `cts` but NOT `cjs`. An
         * unscoped block naming `react/no-unescaped-entities` therefore claims
         * the rule for `.cjs` files too, and eslint hard-fails the whole run
         * with "could not find plugin react".
         *
         * It is latent: it only fires in a repo that actually has a `.cjs`
         * file, which family-wide is exactly one (oc-cosign-web's
         * scripts/db-apply.cjs). Seventeen repos linted clean with the
         * unscoped version.
         */
        files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': 'warn',
            /**
             * Narrowed, not silenced.
             *
             * The rule's default forbid list is > " ' } . Of those, only `>`
             * and `}` can actually change what JSX parses — a stray quote in a
             * text node renders exactly as written. The default list produced
             * 55 errors in oc-me-web alone, every one of them an apostrophe in
             * prose, which is how a lint gate becomes something you append
             * `|| true` to — as every site in this family had.
             *
             * If you want smart quotes in copy, that is a copy decision, not a
             * lint one.
             */
            'react/no-unescaped-entities': ['error', { forbid: ['>', '}'] }],
            /**
             * `destructuring: 'all'` because a destructuring pattern cannot be
             * split. The default 'any' reports `let { state, secrets } = …`
             * whenever ONE of them is never reassigned, and the only way to
             * satisfy it is to destructure twice. 'all' asks the real
             * question: is anything in this pattern reassigned?
             */
            'prefer-const': ['error', { destructuring: 'all' }],
        },
    },
    {
        /**
         * The React 19 hook rules that eslint-config-next 16 turns on, held at
         * `warn` on purpose.
         *
         * Taking the v16 config as-is produced 269 errors across 18 repos —
         * oc-me-web 92, oc-vault-web 42, oc-chat-web 31. Not one is a security
         * finding: they are cascading-render, purity and memoization rules that
         * arrived with the React compiler. Every fix means reasoning about a
         * specific effect's behaviour, and doing 269 of those mechanically
         * across live products is how you ship a regression.
         *
         * This is the same call already made two blocks up for
         * `no-unescaped-entities`, for the same stated reason: a gate that
         * reports hundreds of errors on its first run is a gate somebody
         * appends `|| true` to. At `warn` the findings are visible in every
         * lint run and CI stays honest about what it actually verifies.
         *
         * Promote to `error` per rule as each is cleared.
         *
         * `purity` was triaged first on the theory that an impure call during
         * render (`Date.now()` inside a `useMemo`) causes hydration
         * mismatches. It does not here, and the reason is worth writing down
         * so nobody re-derives it: all 35 findings sit in components that
         * render only AFTER a client-side fetch or a user interaction, so
         * there is no server render for them to disagree with. Checked per
         * call site, not assumed — ProfileSeal is the clearest case, where
         * /u/[addr] deliberately fetches the footprint in an effect because
         * the relay fan-out is too slow to SSR, and ChainDiagram renders only
         * inside an effect-fetched drawer. Four live pages were also loaded in
         * a real browser watching for React's hydration diagnostics
         * (including the minified #418/#423/#425 forms): none fired.
         *
         * So these are staleness, not incorrectness — a `Date.now()` memo
         * that does not refresh with the clock. The fix is a refresh policy
         * per component, which is a product decision rather than a lint one,
         * and that is exactly why they are warnings.
         */
        files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
        rules: {
            'react-hooks/set-state-in-effect': 'warn',
            'react-hooks/purity': 'warn',
            'react-hooks/immutability': 'warn',
            'react-hooks/refs': 'warn',
            'react-hooks/static-components': 'warn',
            'react-hooks/preserve-manual-memoization': 'warn',
            'react-hooks/exhaustive-deps': 'warn',
        },
    },
    {
        /**
         * `.cjs` means CommonJS. `require()` is not a style lapse there, it is
         * the entire reason the extension exists, and next/typescript's
         * no-require-imports applies to every file it can parse. Scoped off
         * rather than disabled per-line in each script.
         */
        files: ['**/*.cjs'],
        rules: { '@typescript-eslint/no-require-imports': 'off' },
    },
];

export default eslintConfig;
