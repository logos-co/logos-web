# logos-demos

Small, self-contained web demos of the Logos stack, built so that anyone can try
them from a URL. No install, no account, no infrastructure for us to run.

The entry point to Logos today is [logos-basecamp](https://github.com/logos-co/logos-basecamp),
a desktop shell shipped as a 94 MB DMG or a 258 MB AppImage, unsigned on macOS,
with no Windows build, whose first screen asks you to browse a catalog and
install your first app. These demos exist to put the same technology behind a
link instead.

## Notes

[`docs/`](./docs/) holds what was learned building these: the Logos stack and
its naming, which endpoints are live and which are reachable from a browser,
`@waku/sdk` behaviour that is not in its types, and the deployment traps in this
monorepo. Read [`docs/browser-viability.md`](./docs/browser-viability.md) before
promising a new demo.

## Design system

**Every demo uses the existing Logos design system.** Do not hand-roll styling.

- Components come from `@acid-info/logos-ui` (`Button`, `Card`, `Table`, icons,
  `LogosMark`). If a primitive is missing, add it to `packages/ui` rather than
  writing a local one.
- **Nothing goes below 14px, and no size is ever a literal.** The token set has
  12px steps; this app defines `text-label` and `text-mono-body` instead, and
  sizes elsewhere come from Tailwind's scale rather than `font-size: 13px` or
  `text-[15px]`.
- Typography uses the token utilities: `text-hero`, `text-h1`, `text-h2`,
  `text-h3-sans`, `text-subhead-sans`, `text-body-sans`, `text-caption-sans`,
  `text-eyebrow`, `text-mono-s`, and the serif variants. Never set
  `font-size`/`line-height` directly or reach for `text-[15px]`.
- Colours use the token utilities: `bg-brand-dark-green`, `text-gray-05`,
  `border-gray-01`, `bg-accent-light-blue`, and so on. Never inline a hex value
  or a raw `var(--color-…)` in a class.

A demo that looks unlike logos.co is a bug, however well it works.

## Demos

| Route         | What it shows                                                                                                                            |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `/`           | Lists the demos. Nothing else.                                                                                                           |
| `/messaging`  | **Logos Messaging**: the browser as a light node, joining the peer-to-peer network directly and exchanging messages with other browsers. |
| `/blockchain` | **Logos Blockchain**: live blocks and consensus state from the testnet nodes, including each block's proof of leadership.                |
| `/storage`    | **Logos Storage**: the address the network would give a file, worked out in the browser, plus the live roster of nodes.                  |

Demos live in a sidebar shell, so a visitor moves between them by clicking. The
catalogue in `src/demos/registry.ts` drives the sidebar, the overview list, and
each demo's own heading. Adding a demo means one entry there plus a route at
its `href`.

A demo page is a heading, the demo, and a **Learn more** button. The
explanation lives in `src/demos/<demo>/how-it-works.md`, read at build time and
rendered into a modal, with mermaid diagrams for the parts that are easier to
draw than to describe. Nobody has to read anything before trying the thing, and
the detail is there for anyone who wants it.

## What is not here

**Nothing is stored on the Logos Storage network.** A browser cannot join it:
discovery is discv5 over UDP, transfer is libp2p TCP, and there is no websocket
transport, and no public gateway exists to call instead. That is a design
choice on the storage side rather than an oversight, and it needs a node we run
to change.

What the storage demo does instead is the part that needs no node: a CID is a
pure function of the bytes, so the address the network _would_ give a file can
be worked out in the page, and is. The file is read in the tab and goes nowhere.

**Nothing here stands in for the network.** An earlier version published files
to this app's own object store so a link could be shared. It worked, and it was
labelled, but it put a demo of somebody else's storage under a Logos Storage
heading. It has been removed and the store deleted.

[`docs/browser-viability.md`](./docs/browser-viability.md) and
[`docs/storage-research.md`](./docs/storage-research.md) record what was checked
and what would unlock the rest.

## Architecture

The Logos protocols run **in the visitor's browser**, not on a server of ours.
`@waku/sdk` starts a light node that bootstraps over DNS discovery, dials the
public fleet over secure websockets, and sends and receives messages itself.

Copy uses the Logos vocabulary: **Logos Messaging** for the stack area, with
**Delivery** and **Chat** as its modules. "Waku" is not used in anything a
visitor reads; library names keep their own names.

That is why every page here is prerendered as static content, and why the
messaging demo has no server in its path at all. Where a route handler does
exist, it is because the browser is not allowed to make the call: the testnet
nodes are plain HTTP while this app is HTTPS (`src/app/api/chain/`), and the
storage roster sends no CORS header (`src/app/api/storage/fleet/`). Each demo
page says which of the two it is.

It also rules out the alternative. `logos-js-sdk` binds the native
`liblogos_protocol` through koffi and dials a long-lived `logoscore` daemon, so
it needs a persistent stateful process and cannot run in a browser or on
serverless. Reaching the Logos module system (`chat_module`, `storage_module`)
that way would mean operating a node; the browser-native path does not.

## Limits worth stating

The current demo publishes to a public content topic on the public Waku fleet,
so it is not private, and it does not reach the `logos.test` cluster that
desktop Basecamp uses. Both limits are written on the page rather than hidden.

`@waku/sdk` uses `clusterId` and bootstrap peers from configuration, so moving
to a Logos fleet later is a settings change, not a rewrite.

## Commands

Run from the repo root:

```bash
pnpm --filter logos-demos dev
pnpm turbo run build --filter=logos-demos
pnpm --filter logos-demos lint
pnpm --filter logos-demos check-types
pnpm --filter logos-demos test
pnpm --filter logos-demos test:e2e
```

Build through turbo: `@acid-info/logos-ui` is a build dependency and only the
orchestrator builds it, so the app build alone fails on a clean checkout.

## Tests

`test` runs the unit tests, which are pure functions only. The CID ones matter
most: their fixtures are a **real Logos Storage node's answers**, obtained by
running the published binary locally and uploading each input, so they fail if
the implementation drifts from the network. A test that only agrees with itself
would never catch that. See [`docs/storage-cid.md`](./docs/storage-cid.md).

`test:e2e` runs Playwright over the flows a person actually takes: a real file
through a real file input, and the address the page works out for it. It also
checks that every page carries a title, a description and a share card, and
that nothing renders below 14px. Point it at a deployment with
`E2E_BASE_URL=<url>`, which is worth doing before calling a fix done, because
more than one bug here only appeared on a real build.

## Deployment

Vercel project `logos-demos` (IFT team), root directory `apps/logos-demos`,
built with the turbo command in `vercel.json`. Deployment protection is off, so
preview URLs are shareable without a Vercel account, the same setting as
`logos-crm` and `logos-co-web`.
