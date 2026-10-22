# Reference

The docs home, getting started, the ecosystem pages, reference pages and the API
references.

<!-- covers: page:/, page:/getting-started/*, page:/ecosystem*, page:/reference/*, page:/integration, page:/infrastructure/relay, page:/api-reference* -->

## Sub-features

- home: `/docs`, the map of the family.
- getting-started: quickstart, which protocol.
- ecosystem: BIP-322, canonical message, conformance, Nostr kind 30078 namespaces,
  security.
- reference: error codes, FAQ, glossary, multi-account.
- integration, infrastructure/relay.
- api-reference: the OpenAPI references (attest, the auth host), rendered by
  `EmbeddedOpenAPI` from the spec it fetches.

## How to reach it

- `https://ochk.io/docs`, `/docs/getting-started/quickstart`, `/docs/ecosystem`,
  `/docs/reference/faq`, `/docs/api-reference/attest`
- `lock.ochk.io/docs/faq` and other retired product docs land here (their own
  redirects).

## How to check it

Static: `yarn check:internal-links`, `yarn check:kinds` (the kind-30078 table), `yarn build`.

Runtime:

```sh
B=https://ochk.io/docs
for p in "" getting-started/quickstart ecosystem ecosystem/nostr-kind-30078 reference/faq reference/error-codes integration infrastructure/relay api-reference api-reference/attest api-reference/auth-host; do
  printf '%-28s ' "/$p"; curl -s -o /dev/null -w '%{http_code}\n' "$B${p:+/$p}"   # the home page is /docs, no slash
done                                                                    # every one 200
```

Proves it when: every page is 200. For an API reference, curl proves only the frame:
the OpenAPI document loads in the browser. In Chromium, `/docs/api-reference/attest`
listed 5 operations (`.opblock`) and `/docs/api-reference/auth-host` 12, with no CSP
error in the console (2026-10-22).

## Gotchas

- `connect-src` in the CSP allows `ochk.io` and `attest.ochk.io` only. An API
  reference that fetches its spec from any other host renders empty, with a CSP error
  in the console.
