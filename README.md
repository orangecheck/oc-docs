# oc-docs

**`docs.ochk.io`** — unified documentation for the OrangeCheck ecosystem.

One site, every protocol:

- **OC Attest** — proof of Bitcoin stake (the base-layer sybil-resistance primitive)
- **OC Lock** — end-to-end encryption addressed to a Bitcoin address
- **OC Stamp** — Bitcoin-block-anchored signed statements
- **OC Vote** — stake-weighted sybil-resistant polls
- **OC Agent** — agent-authorization records (design-state)

Shared concepts (canonical message, BIP-322, Nostr kind-30078, conformance
vectors, SDKs, security model) live in one `Ecosystem` section so they're
written once and cross-linked everywhere — no per-protocol duplication.

## Stack

- Next.js 15 (Pages Router) + MDX via `@next/mdx`
- Tailwind 4 — same design tokens as `ochk.io` (cypherpunk / terminal aesthetic)
- Radix primitives for the sidebar drawer and separators
- Static export-friendly; all pages SSR'd at build time

## Develop

```bash
yarn install
yarn dev      # http://localhost:3000
yarn build    # static production build
yarn check    # type-check + lint + format
```

## Add a page

1. Drop an `.mdx` file under `src/pages/<section>/<slug>.mdx`.
2. Add an entry to the corresponding section in `src/components/docs/nav.ts`.
3. Cross-link from related pages.

Each page should begin with a `metadata` export for SEO:

```tsx
export const metadata = {
    title: 'Page title',
    description: 'One-sentence description for search results and social previews.',
};

# Page title

Content…
```

## License

MIT.
