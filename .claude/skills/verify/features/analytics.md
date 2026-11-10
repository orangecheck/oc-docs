# Analytics

The docs' first-party Plausible event path. Pages post to `/docs/oc-insights/event` (basePath applies), which `next.config.ts` rewrites to `src/pages/api/oc-insights/event.ts`, a re-export of `@orangecheck/site-kit/analytics-event`. That route posts the page view to Plausible with the body, its Content-Type, the User-Agent and the client IP, and no other header. ochk.io's docs zone (`oc-www` `src/proxy.ts`) already drops the cookie, authorization and tab pin before the request reaches this deployment.

<!-- covers: api:ANY /api/oc-insights/event -->

## How to check it

Static: the allowlist is site-kit's, held by its `analytics-event/event.test.ts` and by `check-next`. `src/__tests__/rewrites.test.ts` fails if any rewrite leaves the site.

Runtime, signed out (a GET sends nothing to Plausible):

```sh
curl -s -o /dev/null -D - https://ochk.io/docs/oc-insights/event | grep -i -E '^(HTTP|allow|cache-control):?' | tr -d '\r'
curl -s -o /dev/null -w '/docs/oc-insights.js %{http_code}\n' https://ochk.io/docs/oc-insights.js
```

Proves it when: the event GET is 405 with `allow: POST` and `cache-control: no-store`, from the docs' own route (before it, the GET reached plausible.io and answered 403), and `/docs/oc-insights.js` is 404.

## Gotchas

- A headless browser sends no page view: the sender honours automation, as Plausible's script does.
- The client IP the route reads comes from the request that ochk.io's docs zone makes to this deployment. Whether that carries the visitor's address is not checked here; it is no different from the rewrite to plausible.io this route replaced.
- Nothing here writes.
