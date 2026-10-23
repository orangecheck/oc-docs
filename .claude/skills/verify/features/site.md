# Site

The old host's 308s, moved pages, SDK aliases, the share card and the error pages.

<!-- covers: redirect:*, page:/sdks*, api:ANY /api/og, page:/404, page:/500 -->

## Sub-features

- old-host: every `https://docs.ochk.io/<path>` is one 308 to
  `https://ochk.io/docs/<path>`, with the query kept. The root goes to
  `https://ochk.io/docs`, and `/.well-known/security.txt` to ochk.io's own. These
  rules have `basePath: false` and match the `docs.ochk.io` host only. The signed
  charter URL `/federation/oc-me-v1` must keep resolving.
- moved-pages: `src/lib/moved-pages.ts`, exact paths only. Retired fleet and console
  pages go to the docs home; symbols that moved packages go to their new page.
- sdk-package: `/sdk/<package>` goes to `/sdk/<package>/README`. The old `/sdks/*`
  group goes to `/sdk/*` and `/reference/error-codes`.
- og: `GET /docs/api/og?page=<path>`, the share card PNG with that docs page's own title (from the nav, section above it). A path the docs do not have, and any `?title=`, gets the default card, so a card never carries a caller's text (`src/lib/seo/og-card.ts`; every page's `og:image` names its path).
- 404 and 500: the error pages.

## How to reach it

- Any URL on `https://docs.ochk.io`.
- Any retired path under `https://ochk.io/docs`.
- `https://ochk.io/docs/api/og?page=%2Flock%2Fspec`

## How to check it

Static: `src/__tests__/moved-pages.test.ts` (writes each moved page out and checks its
target), `yarn check:internal-links`.

Runtime:

```sh
for p in / /lock/spec /federation/oc-me-v1 /.well-known/security.txt '/attest?x=1'; do
  printf 'docs.ochk.io%-26s ' "$p"; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "https://docs.ochk.io$p"
done
B=https://ochk.io/docs
for p in /sdks /sdks/javascript /sdk/lock-core /fleet /api; do
  printf '%-18s ' "$p"; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "$B$p"
done
curl -s -o /dev/null -w '%{http_code} %{content_type}\n' "$B/api/og?page=%2Flock%2Fspec"   # 200 image/png
curl -s "$B/api/og" | sha256sum; curl -s "$B/api/og?title=Probe" | sha256sum   # the same hash: caller text is ignored
curl -s -o /dev/null -w '%{http_code}\n' "$B/nope"                                # 404
curl -s -o /dev/null -w '%{http_code}\n' "$B/500"                                 # 500
# On a local build the old-host rules answer to the Host header:
curl -s -H 'Host: docs.ochk.io' -o /dev/null -w '%{http_code} %{redirect_url}\n' "http://localhost:$PORT/lock/spec"
# 308 https://ochk.io/docs/lock/spec
```

Proves it when:

| URL                                     | Status | Location                                    |
| --------------------------------------- | ------ | ------------------------------------------- |
| `docs.ochk.io/`                         | 308    | `https://ochk.io/docs`                      |
| `docs.ochk.io/lock/spec`                | 308    | `https://ochk.io/docs/lock/spec`            |
| `docs.ochk.io/federation/oc-me-v1`      | 308    | `https://ochk.io/docs/federation/oc-me-v1`  |
| `docs.ochk.io/.well-known/security.txt` | 308    | `https://ochk.io/.well-known/security.txt`  |
| `docs.ochk.io/attest?x=1`               | 308    | `https://ochk.io/docs/attest?x=1`           |
| `/docs/sdks`                            | 308    | `https://ochk.io/docs/sdk`                  |
| `/docs/sdks/javascript`                 | 308    | `https://ochk.io/docs/sdk/sdk/README`       |
| `/docs/sdk/lock-core`                   | 308    | `https://ochk.io/docs/sdk/lock-core/README` |
| `/docs/fleet`, `/docs/api`              | 308    | `https://ochk.io/docs`                      |

## Gotchas

- Browsers cache a 308. A page brought back at a moved path needs a new address, or
  its entry removed from `MOVED_PAGES` and the cache waited out.
- `MOVED_PAGES` takes exact paths only. A wildcard there would catch live pages.
- docs.ochk.io must stay attached to the oc-docs Vercel project. A domain detached
  from Vercel keeps its CNAME and serves an expired certificate.
