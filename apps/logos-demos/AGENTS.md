# AGENTS.md

Guidance for agents working inside `apps/logos-demos`. The root `AGENTS.md` still applies; this file adds app-specific instructions for the nearest subtree.

## App Role

Self-contained web demos of the Logos stack, built so anyone can try them from a URL with no install and no account. Next.js 16, Tailwind v4, static output, no API routes. Dev server runs on port **3005**.

The Logos protocols run in the **visitor's browser**, not on a server of ours. `@waku/sdk` starts a light node that bootstraps over DNS discovery and talks to the network itself.

Do not add a backend, an API route, or a service of ours into the message path — "this page has no backend" is the claim the demo makes on screen, and it has to stay true.

**Naming: never write "Waku" in user-facing copy.** logos.co calls this stack area **Logos Messaging**, with **Delivery** and **Chat** as its modules, so that is the vocabulary demos use. Library names and code identifiers (`@waku/sdk`, `use-waku-node.ts`) keep their own names, because that is what they are — the rule is about what a visitor reads, not about renaming a dependency.

**Overview:** [`README.md`](./README.md)

## Use the existing design system (required)

**Every demo uses the existing Logos design system.** Never hand-roll styling — a demo that looks unlike logos.co is a bug, however well it works.

- **Components** come from `@acid-info/logos-ui`: `Button`, `Card`, `Table`, the icon set, `LogosMark`. If a primitive is missing, add it to `packages/ui` rather than writing a local one.
- **Typography** uses the token utilities from `packages/tokens`: `text-hero`, `text-h1`, `text-h2`, `text-h3-serif`, `text-h4-serif`, `text-card-title-serif`, `text-subhead-serif`, `text-body-serif`, `text-h3-sans`, `text-h4-sans`, `text-subhead-sans`, `text-body-sans`, `text-caption-sans`, `text-eyebrow`, `text-mono-s`. Never set a font size or line height directly, and never write `text-[15px]`.
- **Colours** use the token utilities: `bg-brand-dark-green`, `text-brand-off-white`, `text-gray-05`, `border-gray-01`, `bg-accent-light-blue`, and the rest of the palette in `packages/tokens/src/colors.css`. Never inline a hex value, and never put a raw `var(--color-…)` in a className.
- Adding a demo means importing the design system, not restyling from scratch.

Per the root guide, every clickable element still needs `cursor-pointer` in its className — the `Button` primitive does not add it.

## Copy

Demo copy is hardcoded in the components, not routed through `next-intl`, and this app is exempt from the repo-wide i18n rule. The demos are single-locale explanatory pages whose wording is inseparable from the thing being demonstrated; splitting it into message files makes it harder to keep the explanation and the behaviour in step. If a demo ever ships in more than one language, move that demo's copy to `next-intl` at that point.

Copy is still British English and still English-only in committed files.

## Code Organization

- `src/demos/registry.ts` is the demo catalogue and the single source of truth for the sidebar, the overview list, and each demo's heading. Adding a demo means one entry there plus a route at its `href` — never hardcode a demo into the sidebar.
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

## Messaging Notes

- `createLightNode` must be called with `defaultBootstrap: true`. The `discovery` option documents its own defaults, but `createLibp2pAndUpdateOptions` only applies them inside the `defaultBootstrap` branch, so a node created without it registers no peer discovery and never finds a peer.
- `@waku/sdk` Filter delivers only messages published from now on. A tab that opens later needs a Store query (`node.store.queryWithOrderedCallback`) for the backlog, or it starts empty. De-duplicate the overlap between history and live delivery.
- `waitForPeers` needs a generous timeout; discovery and dialling take seconds.
- Moving to a Logos fleet later is a `networkConfig` (`clusterId`, shards) and bootstrap-peer change. Keep those in configuration, not scattered through components.
- **Nothing published to the network can be deleted.** Store nodes hold it for their retention window and there is no delete primitive. To give a demo a clean room, bump the version segment of its content topic (`/logos-demos/<version>/<topic>/proto`); the old traffic stays on the old topic with nobody listening. Never add a "clear messages" control that only empties local state — a reload restores it from Store, and a demo whose whole claim is "there is no server" must not fake a delete.

## Commands

Run from the repo root unless a task explicitly needs the app directory:

```bash
pnpm --filter logos-demos dev
pnpm turbo run build --filter=logos-demos
pnpm --filter logos-demos lint
pnpm --filter logos-demos lint:fix
pnpm --filter logos-demos check-types
```

Build through turbo, never `pnpm --filter logos-demos build`: `@acid-info/logos-ui` is a build dependency and only the orchestrator builds it, so the app build alone fails on a clean checkout. Vercel runs the turbo command via `vercel.json`.

## Frontend Verification

Type-checking passing is not the same as the demo working — these demos depend on a live peer-to-peer network, so browser verification is required before reporting done.

**After editing `globals.css`, restart the dev server.** Turbopack has served stale CSS here more than once, which reads as "my fix did nothing" and sends you looking for a bug that is not there. `rm -rf apps/logos-demos/.next` and start it again, then re-measure.

Start the dev server, wait for the status panel to report `Connected` with a non-zero peer count, then open a second tab and confirm a message crosses between them. Check that a freshly opened tab loads the backlog from Store. Peer discovery takes several seconds, so a page that looks empty on first paint is not yet a failure.

## Keeping Docs Up to Date

Update `README.md` and this file in the same PR when you add or remove a demo, change the deployment setup, or change any rule above.
