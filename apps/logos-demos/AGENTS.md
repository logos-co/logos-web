# AGENTS.md

Rules for agents working in `apps/logos-demos`. The root `AGENTS.md` also applies.

## Role

Browser demos of the Logos stack on port 3005. Pages
are prerendered static; the only server code is the read-only chain and fleet
proxies under `src/app/api/`. Claims are per demo: Messaging has no backend of
ours, Blockchain and Storage read through a proxy. See
[docs/demos.md](docs/demos.md).

## Commands

Run from the repo root:

    pnpm turbo run dev --filter=logos-demos... # http://localhost:3005
    pnpm turbo run build --filter=logos-demos
    pnpm --filter logos-demos lint
    pnpm --filter logos-demos check-types
    pnpm --filter logos-demos test
    pnpm --filter logos-demos test:e2e

Build through turbo, never `pnpm --filter logos-demos build`:
`@acid-info/logos-ui` is a build dependency. Vercel runs it from `vercel.json`.

## Rules

- Nothing below 14px, no font-size literal; use the token scale. See
  [docs/design-system.md](docs/design-system.md).
- Use the existing design system; a demo that looks unlike logos.co is a bug.
  See [docs/design-system.md](docs/design-system.md).
- Copy: no em dashes, no "Waku" in visitor copy, British English; hardcoded
  here, exempt from next-intl. See [docs/design-system.md](docs/design-system.md).
- Keep diagrams narrow: split and stack. See [docs/demos.md](docs/demos.md).
- Parse the normalised proxy shape (`parseChainView` client, `parseNodeStatus`
  route only); an empty panel with a working route is this bug. See
  [docs/blockchain.md](docs/blockchain.md).
- Never conclude an endpoint is browser-readable from curl alone; CORS only
  shows in a console. See [docs/network-access.md](docs/network-access.md).
- Verify protocol code against the real implementation. See
  [docs/storage-cid.md](docs/storage-cid.md).
- Nothing here may stand in for a Logos network. See
  [docs/storage-cid.md](docs/storage-cid.md) and
  [docs/research/browser-viability.md](docs/research/browser-viability.md).
- Deployment facts are runtime facts: prerendered pages freeze `process.env`,
  turbo strips undeclared vars. See [docs/deployment.md](docs/deployment.md).
- Run `test:e2e` against a deployment (`E2E_BASE_URL=<url>`) before calling a
  fix done. See [docs/deployment.md](docs/deployment.md).
- The mimetype is part of the CID; nodes refuse most of them. See
  [docs/storage-cid.md](docs/storage-cid.md).
- Show the shape while waiting, never a blank. See [docs/demos.md](docs/demos.md).
- Page metadata replaces, not merges; restate `openGraph`/`twitter` per page.
  See [docs/demos.md](docs/demos.md).
- One demo per route; `registry.ts` drives sidebar, overview, headings,
  metadata. See [docs/demos.md](docs/demos.md).
- Import `@waku/sdk` lazily; validate everything off the wire. See
  [docs/waku-sdk-notes.md](docs/waku-sdk-notes.md).
- After editing `globals.css`, restart the dev server (stale CSS). See
  [docs/deployment.md](docs/deployment.md).

## Docs

- [docs/demos.md](docs/demos.md): structure, explainers, diagrams, metadata.
- [docs/design-system.md](docs/design-system.md): typography, components, copy.
- [docs/blockchain.md](docs/blockchain.md): the blockchain demo and its proxy.
- [docs/network-access.md](docs/network-access.md): endpoints and browser reach.
- [docs/storage-cid.md](docs/storage-cid.md): CID scheme, mimetypes, proofs.
- [docs/waku-sdk-notes.md](docs/waku-sdk-notes.md): `@waku/sdk` behaviour.
- [docs/deployment.md](docs/deployment.md): Vercel and monorepo build traps.
