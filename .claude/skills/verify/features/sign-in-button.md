# Sign-in button

The integration page for the "Sign in with orangecheck" button: three made-up
sites draw it in their own style, plus orangecheck's own button and the mark.

<!-- covers: page:/integration/sign-in-button -->

## Sub-features

- Three made-up sites (Ledger, Studio, Lantern), light and dark. In each, the
  site's own button, the orangecheck button given the same class, and the mark
  alone in the site's icon button. The components come from
  `@orangecheck/me-client/react`; the sites are `src/components/docs/SignInButtonDemo.tsx`.
- orangecheck's own button (`appearance="brand"`), plain and themed.
- The mark's variants (mono on light, mono on dark, brand, tile).
- Signing in from the page opens the real me.ochk.io window. The recipe below
  replaces `window.open`, so it opens none.

## How to reach it

- `https://ochk.io/docs/integration/sign-in-button`
- The sidebar (Integration), and links from `/me/integrations` and `/me/quickstart`.
- `https://docs.ochk.io/integration/sign-in-button` redirects here (see site.md).

## How to check it

Static: `yarn check:snippets --page sign-in-button` (the React, plain JavaScript and
translated-label blocks compile against the published packages), `yarn build`.

Runtime:

```sh
B=https://ochk.io/docs
curl -s -o /dev/null -w '%{http_code}\n' "$B/integration/sign-in-button"            # 200
curl -s "$B/integration/sign-in-button" | grep -c 'Se connecter avec orangecheck'    # 1: the words section is live
node .claude/skills/verify/scripts/sign-in-button.mjs --base "$B"
```

The script runs 390 and 1440, light and dark, and prints for each:

```text
PASS  390 light: no sideways scroll  (0px over)
PASS  390 light: three sites  (ledger, studio, lantern)
PASS  390 light ledger: as tall as the site's own button  (44, 44 vs 44)
PASS  390 light ledger: the words on one line  (1 lines)
PASS  390 light ledger: mono mark at 3:1 or more  (16.75:1, smallest step between faces 2.34)
PASS  390 light ledger: the mark alone is named and at least 44px  (44x44 "Sign in with orangecheck")
PASS  390 light ledger: Tab reaches it, Enter opens one sign-in window  (focused true, 1 window, aria-busy true)
```

Proves it when: every line is PASS in all four runs. Add `--shots <dir>` to keep a
picture of the three sites per run.

## Gotchas

- The sites follow the docs' theme, which follows the system: drive dark with the
  browser's colour scheme, not a class.
- The button opens its window inside the click. A check that awaits before the
  click, or clicks a button already busy, opens none.
- The mark alone has no words, so find it by `data-label="none"`, and its name by
  `aria-label`.
