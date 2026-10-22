# SDK reference

The TypeDoc reference for every `@orangecheck/*` package, under `/sdk`.

<!-- covers: page:/sdk, page:/sdk/* -->

## Sub-features

- `/sdk`: the package index.
- `/sdk/<package>/README` and one page per exported function, interface, type and
  variable: about 1,270 pages, generated.
- A few written pages sit beside them (`/sdk/cli`, `/sdk/python`).

## How to reach it

- `https://ochk.io/docs/sdk`, `https://ochk.io/docs/sdk/<package>/README`
- `/docs/sdk/<package>` redirects to its README (see site.md); npm READMEs link that
  form.
- The search lists symbols by name: "verify" finds `Function: verify()`.

## How to check it

Static: `yarn build` compiles every page through `src/lib/rehype-typedoc.mjs`.
`src/pages/sdk/` is excluded from prettier; it is generated, not edited.

Runtime:

```sh
B=https://ochk.io/docs
curl -s -o /dev/null -w '%{http_code}\n' "$B/sdk"                                  # 200
curl -s -o /dev/null -w '%{http_code}\n' "$B/sdk/lock-core/README"                 # 200
curl -s -o /dev/null -w '%{http_code}\n' "$B/sdk/agent-core/functions/verifyAction" # 200
```

Proves it when: all three are 200. After a package release, the sync PR's pages carry
the new version: grep a changed signature on the live page.

## Gotchas

- Never edit `src/pages/sdk/` by hand. oc-packages' `scripts/gen-docs.mjs` writes it
  on every release tag and opens a sync PR, merged as `Wil <…>` (a GitHub merge).
  Those merges land on main often, and their deploys cancel yours: compare ancestry,
  not equality, when you check what production serves.
- A symbol that moved packages keeps its old URL through `MOVED_PAGES` (site.md).
