# logos-demos

Small, self-contained web demos of the Logos stack, built so that anyone can try
them from a URL — no install, no account, no infrastructure for us to run.

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
- Typography uses the token utilities: `text-hero`, `text-h1`, `text-h2`,
  `text-h3-sans`, `text-subhead-sans`, `text-body-sans`, `text-caption-sans`,
  `text-eyebrow`, `text-mono-s`, and the serif variants. Never set
  `font-size`/`line-height` directly or reach for `text-[15px]`.
- Colours use the token utilities: `bg-brand-dark-green`, `text-gray-05`,
  `border-gray-01`, `bg-accent-light-blue`, and so on. Never inline a hex value
  or a raw `var(--color-…)` in a class.

A demo that looks unlike logos.co is a bug, however well it works.

## Demos

| Route | What it shows |
| --- | --- |
| `/` | Lists the demos. Nothing else. |
| `/messaging` | **Logos Messaging** — the browser as a light node, joining the peer-to-peer network directly and exchanging messages with other browsers. |
| `/blockchain` | **Logos Blockchain** — recent blocks from the live LEZ testnet, read through the public explorer via a proxy in this app. |

Demos live in a sidebar shell, so a visitor moves between them by clicking. The
catalogue in `src/demos/registry.ts` drives the sidebar, the overview list, and
each demo's own heading — adding a demo means one entry there plus a route at
its `href`.

A demo page is a heading, the demo, and a **Learn more** button. The
explanation lives in `src/demos/<demo>/how-it-works.md`, read at build time and
rendered into a modal, with mermaid diagrams for the parts that are easier to
draw than to describe. Nobody has to read anything before trying the thing, and
the detail is there for anyone who wants it.

## Architecture

The Logos protocols run **in the visitor's browser**, not on a server of ours.
`@waku/sdk` starts a light node that bootstraps over DNS discovery, dials the
public fleet over secure websockets, and sends and receives messages itself.

Copy uses the Logos vocabulary: **Logos Messaging** for the stack area, with
**Delivery** and **Chat** as its modules. "Waku" is not used in anything a
visitor reads; library names keep their own names.

That is the whole reason this app has no API routes and builds to static output:
there is no server in the path to store or read anything.

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
```

Build through turbo: `@acid-info/logos-ui` is a build dependency and only the
orchestrator builds it, so the app build alone fails on a clean checkout.

## Deployment

Vercel project `logos-demos` (IFT team), root directory `apps/logos-demos`,
built with the turbo command in `vercel.json`. Deployment protection is off, so
preview URLs are shareable without a Vercel account — the same setting as
`logos-crm` and `logos-co-web`.
