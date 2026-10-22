---
name: verify
description: Verify the orangecheck docs (ochk.io/docs, Next.js Pages Router with MDX pages under basePath /docs; repo oc-docs, public). Has the feature map of every page, redirect and the search, how to check the deploy, and a proven recipe for each. Use to prove a docs change works, to find which file serves a docs URL, or to see what a change could break.
---

# Verify the docs

`FM=~/.claude/claude-core/bin/featuremap`

- **Where does a page live?** Look its URL up in `features.json` (`id`, `entry`), then
  read `features/<area>.md` for its recipe. `src/generated/doc-sources.json` maps
  every route to its source file too.
- **What did my change touch?** `$FM affected` (add `--since <base>` on a branch).
- **Keeping it current:** a new or moved page is picked up by `$FM generate --write`
  (MDX pages count because `pageExtensions` lists them). Update the matching
  `features/<area>.md` if it adds a section or a redirect, and confirm `$FM check`
  exits 0. Commit this with the page change.

## Static checks

| Check          | Command                     | Proves                                                                       | Baseline (2026-10-22, 5b46e02) |
| -------------- | --------------------------- | ---------------------------------------------------------------------------- | ------------------------------ |
| typecheck      | `yarn type-check`           | the design-system guard (`pretype-check`), then `tsc`                        | passes                         |
| lint           | `yarn lint`                 | the family eslint rules, `.claude/**` included                               | passes                         |
| format         | `yarn format:check`         | prettier over the whole tree, `.claude/**` and Markdown included             | passes                         |
| test           | `yarn test:run`             | moved pages, MDX table of contents, error-body and revocation guards         | passes, 75 tests               |
| build          | `yarn build`                | doc sources, search index, sitemap, then `next build --webpack` of all pages | passes, 265 s                  |
| verify         | `yarn check`                | typecheck, lint and format in one                                            | passes                         |
| internal links | `yarn check:internal-links` | every `/…` link in the pages resolves to a page or a redirect                | passes                         |
| kinds          | `yarn check:kinds`          | prose that names an artifact uses its Nostr kind from the registry page      | passes                         |
| sample imports | `yarn check:sample-imports` | every `@orangecheck/*` import in a sample is a published export (network)    | passes                         |
| live links     | `yarn check:links`          | every concrete ochk.io URL a page hands a reader answers (network)           | not in CI; run before a push   |

CI (free: the repo is public) runs type-check, format, lint, test, the three
content checks and, in a second job, the build, on every push. It also fails on an absolute home-directory path in any tracked file, so never
write one here.

Known pre-existing failures: none.

## Launch

Production is the default target: `https://ochk.io/docs`, served by the `oc-docs`
Vercel project and reached through ochk.io's rewrite of `/docs/*`.

A local build, before a push:

```sh
yarn build                                  # 265 s; regenerates doc sources and the search index first
PORT=3418                                   # any free port
yarn start -p $PORT > /tmp/oc-docs-$PORT.log 2>&1 &
timeout 60 bash -c "until curl -s -o /dev/null http://localhost:$PORT/docs/lock/spec; do sleep 1; done"
```

Then run any recipe with `B=http://localhost:$PORT/docs` instead of the production
base. Every page answers under `/docs`; `http://localhost:$PORT/lock/spec` is a 404.
The old-host rules match by `Host`, so send `-H 'Host: docs.ochk.io'` to try them
locally.

## Doctor

```sh
# Production serves the commit you think it does. The token is in the workspace .env, two levels above the repo's git dir.
ENV="$(git rev-parse --path-format=absolute --git-common-dir)/../../.env"
T=$(grep -E '^VERCEL_TOKEN=' "$ENV" | cut -d= -f2- | tr -d '"')
TEAM=$(curl -s -H "Authorization: Bearer $T" https://api.vercel.com/v2/teams \
  | python3 -c "import sys,json;print(next(t['id'] for t in json.load(sys.stdin)['teams'] if t['slug']=='xaxis-projects'))")
curl -s -H "Authorization: Bearer $T" \
  "https://api.vercel.com/v6/deployments?app=oc-docs&target=production&limit=1&teamId=$TEAM" \
  | python3 -c "import sys,json;d=json.load(sys.stdin)['deployments'][0];print(d['meta']['githubCommitSha'][:7],d['state'])"
git rev-parse --short origin/main
curl -s -o /dev/null -w '%{http_code}\n' https://ochk.io/docs/lock/spec   # 200
```

The two shas match and the state is READY. The bot's TypeDoc sync PRs land on main
often; a sync commit above yours carries your change too, so compare ancestry
(`git merge-base --is-ancestor <yours> <deployed>`), not equality.

## Drive

- **Pages and redirects:** `curl` for status, `Location` and the rendered `<title>`
  (recipes in `features/*.md`).
- **Search:** `scripts/docs-search.mjs` drives it in Chromium: `?q=`, `/`, Ctrl+K,
  results and Enter. Playwright comes from `PLAYWRIGHT_MODULE`, because this repo
  does not install it:

```sh
export PLAYWRIGHT_MODULE=/path/to/node_modules/playwright/index.mjs
node .claude/skills/verify/scripts/docs-search.mjs --q "device revocation" --expect /lock/
```

## Evidence

- Quote the command and its decisive output: status and `Location`, the `<title>`,
  the PASS lines.
- A changed page is proven when the live page carries the new text (`curl … | grep`)
  and no longer carries the old one. Check both.
- If a path is unreachable, name the missing precondition and prove the nearest real
  path. Never report it as verified.

## Cleanup

Stop the local server by its port, and only if it runs from this checkout (`yarn`'s
own pid is not the server's):

```sh
PID=$(ss -ltnp | grep ":$PORT " | grep -o 'pid=[0-9]*' | cut -d= -f2)
[ "$(readlink /proc/$PID/cwd)" = "$PWD" ] && kill $PID
```

Other sessions run Next servers on this machine; kill nothing else. `yarn build` rewrites `public/sitemap.xml` and
`src/generated/doc-sources.json`; restore them (`git checkout -- <file>`) unless the
change meant to regenerate them.
