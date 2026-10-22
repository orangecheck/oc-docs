# Search

Search every docs page from the header.

<!-- covers: ui:search -->

## Sub-features

- open: the header's search, `/` or Ctrl+K (⌘K) anywhere, or `?q=<words>` in any docs
  URL, which opens it with the query typed.
- results: every word must appear. A word in a title counts most, then a heading,
  then the text, and the last word may be a prefix. Results are grouped by sidebar
  section or SDK package. Enter or a click opens the page at its section.
- index: `public/search-index.json`, written by `scripts/gen-search-index.mjs` on
  `predev` and `prebuild`, not committed. It is fetched the first time someone types.

## How to reach it

- `https://ochk.io/docs/?q=device%20revocation`
- `/` or Ctrl+K on any docs page.

## How to check it

Static: `yarn build` writes the index; `src/lib/search.ts` ranks.

Runtime:

```sh
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' https://ochk.io/docs/search-index.json   # 200 application/json
node .claude/skills/verify/scripts/docs-search.mjs --q "device revocation" --expect /lock/
```

The script prints:

```text
PASS  ?q= opens the search with the query
PASS  it lists results
PASS  Enter opens a docs page  (/docs/lock/device-keys)
PASS  / opens the search
PASS  Ctrl+K opens the search
```

Proves it when: every line is PASS, and a page you just added or changed is found by a
word in its title.

## Gotchas

- The index is about 1 MB and is built at build time. A page added after the last
  deploy is not in it, and neither is text changed since.
- `--expect` matches a result link's href. Pick a query whose top results are known.
