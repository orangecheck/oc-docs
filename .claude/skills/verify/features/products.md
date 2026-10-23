# Products

The docs for ochk.app and its API (`/me`), OC Vault, OC Cosign and Connect, and the
two charters.

<!-- covers: page:/me*, page:/vault*, page:/cosign*, page:/connect, page:/federation/oc-me-v1, page:/charter -->

## Sub-features

- me: ochk.app and the me.ochk.io API: quickstart, SDK (`@orangecheck/me-client`),
  API, webhooks, custody, federation, operator pages (charter, runbook, in-browser
  operator), paying users, drops, require-bond, glossary, integrations.
- vault, cosign, connect: each product's guide pages.
- federation/oc-me-v1: the signed federation charter. Its URL is quoted in signed
  material, so it must never move. Its old address on docs.ochk.io must keep landing
  here.
- charter: the OrangeCheck charter, ratified v1, the eight commitments to customers
  and the protocol family.

## How to reach it

- `https://ochk.io/docs/me`, `/docs/vault`, `/docs/cosign`, `/docs/connect`
- `https://ochk.io/docs/federation/oc-me-v1`, and its old address
  `https://docs.ochk.io/federation/oc-me-v1` (308)
- `https://ochk.io/docs/charter`

## How to check it

Static: `yarn check:internal-links`, `yarn check:sample-imports`, `yarn check:snippets`, `yarn build`.

Runtime:

```sh
B=https://ochk.io/docs
for p in me me/quickstart me/sdk me/operator/charter vault cosign connect federation/oc-me-v1 charter; do
  printf '%-22s ' $p; curl -s -o /dev/null -w '%{http_code}\n' "$B/$p"
done                                                                    # every one 200
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://docs.ochk.io/federation/oc-me-v1
# 308 https://ochk.io/docs/federation/oc-me-v1
```

Proves it when: every page is 200 and the charter's old address is one 308 to its
new one.

## Gotchas

- Human-facing links in these pages say ochk.app. API URLs, `/.well-known/*`, the
  sign-in popup and kind 30087 keep their me.ochk.io names. A sweep that rewrites
  every `me.ochk.io` breaks the API pages.
