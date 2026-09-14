# AGENTS.md

Guidance for agents working inside `apps/logos-demos`. The root `AGENTS.md` still applies; this file adds app-specific instructions for the nearest subtree.

## App Role

Self-contained web demos of the Logos stack, built so anyone can try them from a URL with no install and no account. Next.js 16, Tailwind v4. Every page is prerendered as static content; the only server code is the blockchain demo's read-only proxy under `src/app/api/blockchain/`. Dev server runs on port **3005**.

Logos Messaging runs entirely in the **visitor's browser**: `@waku/sdk` starts a light node that bootstraps over DNS discovery and talks to the network itself, with no server of ours in the path. Logos Blockchain cannot do that, because the block explorer sends no CORS headers, so it reads through the proxy instead. See the claims rule below.

**Claims are per demo, not app-wide.** Logos Messaging genuinely has no backend: the browser is a node and no server of ours is in the path. Keep it that way, and never route messaging through an API route. Logos Blockchain does have a proxy in the path, because the block explorer sends no CORS headers, and its page says so plainly.

A proxy is allowed only where the alternative is no demo at all, and only for **public, read-only** data: no keys, no user content, no writes. If a proxy starts carrying anything user-specific it is a different thing and needs its own argument. Whatever a demo does, its page must say it.

**Naming: never write "Waku" in user-facing copy.** logos.co calls this stack area **Logos Messaging**, with **Delivery** and **Chat** as its modules, so that is the vocabulary demos use. Library names and code identifiers (`@waku/sdk`, `use-waku-node.ts`) keep their own names, because that is what they are. The rule is about what a visitor reads, not about renaming a dependency.

**Overview:** [`README.md`](./README.md)

**Notes:** [`docs/`](./docs/) covers the stack and its naming, live endpoints and what a browser can reach, `@waku/sdk` gotchas, and deployment traps. Read [`docs/browser-viability.md`](./docs/browser-viability.md) before promising a new demo, and add to `docs/` when you learn something the hard way.

## Nothing smaller than 14px, and no size literals

The shared tokens include 12px steps (`text-eyebrow`, `text-mono-s`, `text-caption-sans`). **Do not use them here.** This app defines `text-label` and `text-mono-body` in `globals.css` for those roles, and `text-body-sans` is already 14px.

Never write a font size as a literal, in CSS or as `text-[15px]`. Sizes come from Tailwind's scale (`var(--text-sm)`, `var(--text-base)`, `var(--text-lg)`, `var(--text-xl)`).

The tokens are not changed to fix this, because logos.co uses them too.

## Use the existing design system (required)

**Every demo uses the existing Logos design system.** Never hand-roll styling. A demo that looks unlike logos.co is a bug, however well it works.

- **Components** come from `@acid-info/logos-ui`: `Button`, `Card`, `Table`, the icon set, `LogosMark`. If a primitive is missing, add it to `packages/ui` rather than writing a local one.
- **Typography** uses the token utilities from `packages/tokens`: `text-hero`, `text-h1`, `text-h2`, `text-h3-serif`, `text-h4-serif`, `text-card-title-serif`, `text-subhead-serif`, `text-body-serif`, `text-h3-sans`, `text-h4-sans`, `text-subhead-sans`, `text-body-sans`, `text-caption-sans`, `text-eyebrow`, `text-mono-s`. Never set a font size or line height directly, and never write `text-[15px]`.
- **Colours** use the token utilities: `bg-brand-dark-green`, `text-brand-off-white`, `text-gray-05`, `border-gray-01`, `bg-accent-light-blue`, and the rest of the palette in `packages/tokens/src/colors.css`. Never inline a hex value, and never put a raw `var(--color-…)` in a className.
- Adding a demo means importing the design system, not restyling from scratch.

Per the root guide, every clickable element still needs `cursor-pointer` in its className, because the `Button` primitive does not add it.

## Copy

**No em dashes anywhere.** Not in page titles, body copy, explainers, docs, or code comments. They read as machine-written. Use a comma, a colon, a full stop, or split the sentence. That includes the long dash some UIs use to stand in for a missing value: say what is actually missing instead, like `not reported` or `none`.


Demo copy is hardcoded in the components, not routed through `next-intl`, and this app is exempt from the repo-wide i18n rule. The demos are single-locale explanatory pages whose wording is inseparable from the thing being demonstrated; splitting it into message files makes it harder to keep the explanation and the behaviour in step. If a demo ever ships in more than one language, move that demo's copy to `next-intl` at that point.

Copy is still British English and still English-only in committed files.

## Code Organization

- `src/demos/registry.ts` is the demo catalogue and the single source of truth for the sidebar, the overview list, and each demo's heading. Adding a demo means one entry there plus a route at its `href`. Never hardcode a demo into the sidebar.
- One demo per route under `src/app/<demo>/`. `/` is the overview, which lists the demos and nothing else; `/messaging` is the messaging demo.
- `DemoShell` (in `src/components/`) is the sidebar shell, rendered from the root layout. It derives the active item from `usePathname`.
- **A demo page carries no explanatory prose.** It is a heading, the demo, and a Learn more button. Everything about how the thing works belongs in that demo's `src/demos/<demo>/how-it-works.md`, which the page reads at build time through `readExplainer` and the dialog renders. A visitor who wants to play is not made to read first, and a visitor who wants the detail gets more than a paragraph would have given them.
- Explainers are real `.md` files so they stay editable as markdown. Use ```mermaid fences for diagrams; `MermaidDiagram` lazy-imports mermaid so it never lands in the page bundle.

### Keep diagrams narrow (required)

**A wide diagram must be split and stacked vertically, never left to run wide.** The dialog column is about 840px. mermaid emits a `viewBox`, so a drawing wider than its column gets scaled down with its text: a 1420px flowchart rendered its 14px labels at 6px and was unreadable.

- Lay comparisons out as stacked rows (`flowchart TB` with `direction LR` inside each subgraph), not side by side. Two subgraphs with no edge between them are independent roots and mermaid will place them side by side anyway, so join them with an invisible link (`usual ~~~ here`) to force the stack.
- Keep sequence diagrams to three participants and short arrow labels. Label length is what drives participant spacing, so "what did I miss?" costs less width than a full sentence.
- Measure rather than eyeball: open the dialog and compare each SVG's `viewBox` width against its rendered width. Anything below about 0.95 is being shrunk, and the fix is a narrower diagram, not a smaller font.
- `useMaxWidth: false` is set for flowcharts and sequence diagrams so mermaid emits a pixel width instead of `width="100%"`, and `.mermaid-figure` scrolls. That is a backstop, not a licence to draw wide: a diagram the reader has to scroll sideways has already failed.
- `LearnMoreDialog` is the modal pattern: React Aria `ModalOverlay`/`Modal`/`Dialog`, `isDismissable` for click-outside, and a two-step close whose `EXIT_MS` mirrors `--dialog-exit` in the stylesheet. Keep those two in step, or the panel will be torn out mid-animation.
- Protocol code that does not depend on React lives in `src/lib/`. Keep it framework-free so it can move into a shared package unchanged.
- React state that owns a node's lifetime lives in a hook under `src/components/`.
- Import `@waku/sdk` lazily, inside an effect (`await import('@waku/sdk')`). It reaches for browser APIs that do not exist during server rendering, and it pulls in libp2p, which does not belong in the initial bundle.
- Validate everything arriving off the wire before rendering it. Topics are public and other applications may publish there.

## Proxied data is normalised, so parse the right shape

`/api/chain` normalises what the nodes return before answering, which means there are **two shapes for the same record** and two parsers in `src/lib/cryptarchia.ts`:

- `parseNodeStatus` takes the **node's** shape. Only the route handler uses it.
- `parseChainView` takes the **normalised** shape. Only client code uses it.

Using the wrong one is silent. There is no type error, because both take `unknown`, and no runtime error, because a parser that finds no fields returns null and the row is dropped. The list simply comes out empty. This happened twice on the previous explorer-based version.

**If a panel renders empty while its route returns data, check this first.**

`/api/storage/fleet` avoids the trap by passing the roster through unchanged. There is one shape and one parser, `parseFleet`, and it runs on the client.

## Never conclude an endpoint is browser-readable from curl alone

A missing `access-control-allow-origin` header looks exactly like a success in a terminal: the status is 200 and the body is right there. Only the browser enforces it. `fleets.logos.co` was written up as needing no proxy on the strength of a clean `curl`, and the page then failed with a CORS error on first load.

**Open the page and read the console before writing down that something works from a browser.**

## Verify protocol code against the real implementation

`src/lib/storage-cid.ts` reimplements a piece of logos-storage-nim. Its tests do not check it against itself. The fixtures are a real node's answers, obtained by downloading the published binary and uploading each input. See docs/storage-cid.md.

Do the same for anything that reimplements a protocol. A self-consistent test proves the code agrees with itself, which is exactly the thing that was never in doubt. Prebuilt binaries and stored artefacts on disk beat guessing: when the manifest encoding was wrong, `xxd` on the node's own manifest file named the field in seconds.

## Nothing here may stand in for a Logos network

The storage demo once published files to an object store of ours so a link could be shared. It was labelled as such and it still had to go: a demo of somebody else's storage does not belong under a Logos Storage heading, and a reader who has to reach the small print has already been misled.

**If a piece of a demo is not the Logos stack, it does not ship.** Say what cannot be done instead. `docs/browser-viability.md` is where that judgement gets recorded.

## Deployment facts are runtime facts, not build-time ones

A statically prerendered page freezes anything it reads from `process.env` at build time, and the build does not even see most variables: `turbo.json` declares an `env` allowlist and Turborepo 2 strips the rest. Ask a route handler instead, which runs per request and needs no declaration.

## Run the end-to-end suite against a deployment before calling a fix done

`E2E_BASE_URL=<url> pnpm --filter logos-demos test:e2e` skips the dev server and drives that deployment instead. Both share bugs so far only appeared on a real build, and a local pass said nothing about either.

The suite starts a **fresh** dev server each run, so stop any dev server already on port 3005 (the Browser pane runs one) or the run fails immediately. It used to reuse a running one, and a run then reused a server started before the fix under test and reported it broken. Set `E2E_REUSE_SERVER=1` to opt back in, but not while judging whether a change worked.

## The mimetype is part of the CID, and nodes refuse most of them

A node maps the request's Content-Type through nim's `std/mimetypes` and answers 422 if nothing matches. `text/markdown` does not match, so dropping any `.md` file, a README for instance, hits it. Uploading with no Content-Type is allowed and the manifest simply omits the field.

`src/lib/storage-mimetypes.ts` carries the accepted set, generated from nim's table. Do not widen it by guessing; check against a node.

## Show the shape while waiting, never a blank

Every demo reads a live network, so there is always a wait: four testnet nodes, a roster fetch, a light node finding peers. Blank and then suddenly full reads as broken and then startling.

`src/components/skeleton.tsx` holds the placeholders. Mirror the real layout rather than inventing a generic box, and keep labels as real text: they are known before the values are, and `Height` is more use than a grey rectangle.

**A skeleton cannot promise identical height.** A value of unknown length may wrap, and some network names do. It promises the rows exist from the start, so the card settles instead of unfolding. `e2e/loading.spec.ts` delays the responses on purpose, because locally they answer in well under a second and none of this can be seen by hand.

## Page metadata replaces, it does not merge

A page that sets `openGraph` or `twitter` in its metadata replaces the layout's object outright. Miss `images` or `card` and the page silently stops carrying a share card. Nothing fails, the link just previews as bare text. `demoMetadata` in `src/demos/metadata.ts` restates them for that reason, and `e2e/metadata.spec.ts` checks every demo still has them.

Titles, descriptions and the sitemap all come from `src/demos/registry.ts`, so a new demo needs an entry there and nothing else.

## Blockchain Notes

- The nodes come from `deployment/.env.testnet` in `logos-blockchain`: `PUBLIC_IP_ADDR` with API ports 18080-18083. They are public and send `access-control-allow-origin: *`.
- **The route handler exists because of mixed content, not CORS.** The nodes are plain HTTP and this app is HTTPS, so a browser blocks the request before it is sent. If the nodes ever get TLS, delete the route and call them from the page.
- `state: "Online"` means the process is up, not that blocks are being produced. Liveness is measured by watching when the height last changed.
- Measured cadence is a block every 30 to 90 seconds. Anything poll-count based flaps between normal blocks, so the stall threshold is time-based and set well above the longest observed gap.
- Cryptarchia's `height` and `slot` are the base chain's own counters. They are unrelated to LEZ block numbers, which come from a different layer and a separate indexer.
- One unreachable node must not take the view down. `/api/chain` drops it and renders the rest.

## Messaging Notes

- `createLightNode` must be called with `defaultBootstrap: true`. The `discovery` option documents its own defaults, but `createLibp2pAndUpdateOptions` only applies them inside the `defaultBootstrap` branch, so a node created without it registers no peer discovery and never finds a peer.
- `@waku/sdk` Filter delivers only messages published from now on. A tab that opens later needs a Store query (`node.store.queryWithOrderedCallback`) for the backlog, or it starts empty. De-duplicate the overlap between history and live delivery.
- `waitForPeers` needs a generous timeout; discovery and dialling take seconds.
- Moving to a Logos fleet later is a `networkConfig` (`clusterId`, shards) and bootstrap-peer change. Keep those in configuration, not scattered through components.
- **Nothing published to the network can be deleted.** Store nodes hold it for their retention window and there is no delete primitive. To give a demo a clean room, bump the version segment of its content topic (`/logos-demos/<version>/<topic>/proto`); the old traffic stays on the old topic with nobody listening. Never add a "clear messages" control that only empties local state. A reload restores it from Store, and a demo whose whole claim is "there is no server" must not fake a delete.

## Commands

Run from the repo root unless a task explicitly needs the app directory:

```bash
pnpm --filter logos-demos dev
pnpm turbo run build --filter=logos-demos
pnpm --filter logos-demos lint
pnpm --filter logos-demos lint:fix
pnpm --filter logos-demos check-types
pnpm --filter logos-demos test
```

Build through turbo, never `pnpm --filter logos-demos build`: `@acid-info/logos-ui` is a build dependency and only the orchestrator builds it, so the app build alone fails on a clean checkout. Vercel runs the turbo command via `vercel.json`.

## Frontend Verification

Type-checking passing is not the same as the demo working. These demos depend on a live peer-to-peer network, so browser verification is required before reporting done.

**After editing `globals.css`, restart the dev server.** Turbopack has served stale CSS here more than once, which reads as "my fix did nothing" and sends you looking for a bug that is not there. `rm -rf apps/logos-demos/.next` and start it again, then re-measure.

Start the dev server, wait for the status panel to report `Connected` with a non-zero peer count, then open a second tab and confirm a message crosses between them. Check that a freshly opened tab loads the backlog from Store. Peer discovery takes several seconds, so a page that looks empty on first paint is not yet a failure.

## Keeping Docs Up to Date

Update `README.md` and this file in the same PR when you add or remove a demo, change the deployment setup, or change any rule above.
