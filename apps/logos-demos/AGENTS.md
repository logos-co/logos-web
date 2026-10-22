# AGENTS.md

Rules for agents working in `apps/logos-demos`. The root `AGENTS.md` also applies.

## Role

Browser demos of the Logos stack, on port 3005. Pages are prerendered. The only
server code is the read-only proxies under `src/app/api/` and the
server-rendered block page `src/app/blockchain/block/[id]/`. Messaging has no
backend of ours; Blockchain and Storage read through a proxy. See
[docs/demos.md](docs/demos.md).

## Commands

Run from the repo root:

    pnpm turbo run dev --filter=logos-demos... # http://localhost:3005
    pnpm turbo run build --filter=logos-demos
    pnpm --filter logos-demos lint
    pnpm --filter logos-demos check-types
    pnpm --filter logos-demos test
    pnpm --filter logos-demos test:e2e

Never run `pnpm --filter logos-demos build`: `@acid-info/logos-ui` must be built
first and only turbo does that. Vercel runs the turbo command from `vercel.json`.

## Rules

- Use the Logos design system and the token type scale. No text below 14px, no
  font-size literals. See [docs/design-system.md](docs/design-system.md).
- Copy: British English, no em dashes, never "Waku" in visitor copy. Copy is
  hardcoded here; this app is exempt from next-intl. Same doc.
- Add a demo through `src/demos/registry.ts` plus one route; the registry drives
  the sidebar, overview, headings, metadata and sitemap. See
  [docs/demos.md](docs/demos.md).
- Restate `openGraph` and `twitter` on every page that sets them; Next replaces
  the layout's objects. Use `demoMetadata`.
- Split and stack wide mermaid diagrams. Show skeletons while waiting, never a
  blank panel.
- Never route messaging through a server. Proxies carry public, read-only data
  only.
- Client code parses `/api/chain` with `parseChainView`; `parseNodeStatus` is for
  server code only. A panel that renders empty while its route returns data is
  this bug. See [docs/blockchain.md](docs/blockchain.md).
- Don't trust curl to prove an endpoint is browser-readable; CORS shows only in
  the browser console. See [docs/network-access.md](docs/network-access.md).
- Check protocol code against a real node, never against itself. The mimetype
  is part of the CID and nodes refuse most types. See
  [docs/storage-cid.md](docs/storage-cid.md).
- Nothing here may stand in for a Logos network. See
  [docs/research/browser-viability.md](docs/research/browser-viability.md).
- Import `@waku/sdk` lazily and validate everything off the wire. See
  [docs/waku-sdk-notes.md](docs/waku-sdk-notes.md).
- Don't read `process.env` from prerendered pages: the value freezes at build
  and turbo strips undeclared vars. See [docs/deployment.md](docs/deployment.md).
- Before calling a fix done, run `E2E_BASE_URL=<url> pnpm --filter logos-demos
  test:e2e` against a deployment.
- Never run `vercel deploy` from the repo root; it targets `logos-co-web`.
- After editing `globals.css`, delete `.next` and restart the dev server.

## Docs

[docs/README.md](docs/README.md) indexes the reference docs.
