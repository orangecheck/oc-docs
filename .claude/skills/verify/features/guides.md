# Guides

What each verb is and how to use it: OC Attest, OC Lock, OC Vote, OC Stamp, OC Agent,
OC Pledge, and OC Chat (a mode of OC Lock).

<!-- covers: page:/attest*, page:/lock*, page:/vote*, page:/stamp*, page:/agent*, page:/pledge*, page:/chat* -->

## Sub-features

- Each verb has an index, a quickstart, a how-it-works, a spec page that summarises
  the spec repo, protocol flows, security and why. Some have more (attest guides, lock
  device keys, vote tally algorithm, stamp OTS anchor, pledge resolution grammar, chat
  modes and transport).
- Each page is one MDX file under `src/pages/<verb>/`. The sidebar comes from
  `src/components/docs/nav.ts`; the table of contents from `src/lib/mdx-toc.mjs`.
- A spec page restates its spec repo's rules. When a spec changes, its docs page
  changes in the same piece of work (the `oc-<verb>-protocol` repo is public too).

## How to reach it

- `https://ochk.io/docs/<verb>` and `https://ochk.io/docs/<verb>/<page>`
- The sidebar, the search, and links from ochk.io's protocol pages.
- `https://docs.ochk.io/<verb>/<page>` redirects here (see site.md).

## How to check it

Static: `yarn check:internal-links`, `yarn check:kinds`, `yarn check:sample-imports`,
`yarn check:snippets`, `yarn build`.

Runtime:

```sh
B=https://ochk.io/docs
for p in attest lock vote stamp agent pledge chat lock/spec stamp/ots-anchor; do
  printf '%-18s ' $p; curl -s -o /dev/null -w '%{http_code}\n' "$B/$p"
done                                                                         # every one 200
curl -s "$B/lock/spec" | grep -o '<title[^>]*>[^<]*' | head -1                # Specification · OC Lock — orangecheck docs
curl -s "$B/lock/spec" | grep -c 'href="/lock/'                               # 0: every link carries /docs
curl -s "$B/lock/spec" | grep -c 'A device revoking itself should carry it'  # 1: the page carries OC Lock 2.2.1's rule
```

Proves it when: every page is 200, the title names the page, no link drops the
`/docs` prefix, and the text you changed is live.

## Gotchas

- A link written as `/lock/spec` in MDX gets `/docs` from `next/link`. A raw `<a>` or
  a link inside a code block does not. `check:internal-links` catches the first kind;
  grep the rendered HTML for the second.
- Every ts/tsx/js/python block compiles as a file of its own (`check:snippets`).
  Declare placeholder inputs in the block (`declare const env: StampEnvelope; // from
step 1`); mark a true fragment with `no-check` on the fence (` ```ts no-check `).
  `--page <path part>` and `--only ts|python` narrow a run.
- A page added without a sidebar entry is reachable but hard to find. Check
  `nav.ts` when you add one.
