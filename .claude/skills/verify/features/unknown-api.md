# Unknown API addresses

Any `/api` address the site does not serve answers a JSON 404, for every method, so a client that checks `res.ok` or parses JSON never takes a missing endpoint for a success.

<!-- covers: api:ANY /api/[...unknown] -->

## Sub-features

- `src/pages/api/[...unknown].ts` answers `404 {"ok":false,"error":"not_found"}` with `Cache-Control: no-store` for GET, POST and any other method. It is the same file as me.ochk.io's and ochk.app's.
- Next matches it only after every real API route, and after the next.config rewrites, so it never shadows an endpoint.

## How to reach it

Any `https://ochk.io/docs/api/<path>` with no route behind it: a mistyped, removed or retired endpoint.

## How to check it

Static: `src/lib/unknown-api-route.test.ts` (GET, POST, PUT and DELETE answer the JSON 404; it fails with the route deleted).

Runtime:

```sh
for m in POST GET PUT; do curl -s -X $m -w " %{http_code} %{content_type}\n" https://ochk.io/docs/api/zz-no-such-route; done
curl -s -D - -o /dev/null https://ochk.io/docs/api/zz-no-such-route | grep -i '^cache-control'
curl -s -o /dev/null -w 'existing route: %{http_code} %{content_type}\n' 'https://ochk.io/docs/api/og?title=hello'
```

Proves it when every method answers `{"ok":false,"error":"not_found"} 404 application/json` with `cache-control: no-store`, and the existing route still answers as it did, here `/api/og`, the site's only other API route, with `200 image/png`.

## Gotchas

- Before the catch-all, a POST to an unknown address got the HTML not-found page, with status 200 on most of the family. A status of 200 or an HTML body here means the route is gone.
- The PUT probe sends no body and reaches no handler, so it writes nothing.
