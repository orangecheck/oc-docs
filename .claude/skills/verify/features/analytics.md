# Analytics

Page views go to oc-insights only. `FamilyAnalytics` in `_document` puts site-kit's oc-pulse loader in the head, which loads `https://insights.ochk.io/oc-pulse.js` and reports each page as origin and path, on `https://ochk.io` only (`ANALYTICS.origins` in `src/lib/inline-scripts.ts`), so a preview deploy counts nothing. The docs have no analytics route of their own: the Plausible sender and its `/docs/oc-insights/event` proxy were removed when the family stopped using Plausible (2026-11).

## How to check it

Static: `inline-scripts.test.ts` holds the head to the scripts `HEAD_SCRIPTS` hashes (logo and oc-pulse loader) plus the theme script, and `oc-site-kit csp-check` holds every built page to its policy, which lists `https://insights.ochk.io` in script-src and connect-src.

Runtime, signed out:

```sh
curl -s https://ochk.io/docs/ | grep -o -i -E 'plausible|insights\.ochk\.io/oc-pulse\.js' | sort | uniq -c
curl -s -o /dev/null -w '/docs/oc-insights/event %{http_code}\n' https://ochk.io/docs/oc-insights/event
```

Proves it when: the page names `insights.ochk.io/oc-pulse.js` and never `plausible`, and `/docs/oc-insights/event` answers 404.

## Gotchas

- A headless browser sends no page view: oc-pulse honours automation.
- Nothing here writes.
