# Products

The docs for ochk.app and its API (`/me`), OC Vault, OC Cosign and Connect, and the
two charters.

<!-- covers: page:/me*, page:/vault*, page:/cosign*, page:/connect, page:/federation/oc-me-v1, page:/charter -->

## Sub-features

- me: ochk.app and the me.ochk.io API: quickstart, SDK (`@orangecheck/me-client`),
  API, webhooks, custody, federation, operator pages (charter, runbook, in-browser
  operator, the operator suite test report), paying users, drops, require-bond,
  glossary, integrations, and the testing phase's test report (`/me/test-report`,
  a draft) with its anchor proof file under `public/test-report/`.
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
for p in me me/quickstart me/sdk me/operator/charter me/operator/test-report me/test-report vault cosign connect federation/oc-me-v1 charter; do
  printf '%-22s ' $p; curl -s -o /dev/null -w '%{http_code}\n' "$B/$p"
done                                                                    # every one 200
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://docs.ochk.io/federation/oc-me-v1
# 308 https://ochk.io/docs/federation/oc-me-v1
curl -s "$B/vault/protocol" | grep -oE 'id="(signed-lock-export|the-bitcoin-device-tier)"'
# id="signed-lock-export" and id="the-bitcoin-device-tier"
curl -s "$B/test-report/05ad976f08bb7fee785a30853ae75fbdfef1e079c70007cb9390fed43dd40ab9.ots" | sha256sum
# 860d3215f10ee5aad411483faf3ff236a86c217c3784636999904cc3953d0fa8: the anchor proof /me/test-report links
```

Proves it when: every page is 200, the charter's old address is one 308 to its
new one, and the vault protocol page carries the `.lock` export and the Bitcoin
device tier sections. The test report is also linked from the docs navigation
(Operator suite test report, under ochk.app): `grep -c "me/operator/test-report"
src/components/docs/nav.ts` is 1, and so is `grep -c "'/me/test-report'"` there. The
anchor proof serves byte for byte, and the page's block and transaction ids are the
evidence a reader checks.

## Gotchas

- Human-facing links in these pages say ochk.app. API URLs, `/.well-known/*`, the
  sign-in popup and kind 30087 keep their me.ochk.io names. A sweep that rewrites
  every `me.ochk.io` breaks the API pages.
