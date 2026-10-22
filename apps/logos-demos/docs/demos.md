# Demo structure and conventions

How the demos are put together, and the conventions that keep what each page
claims true. Code: [`src/demos/`](../src/demos), [`src/app/`](../src/app) and
[`src/components/`](../src/components).

## Claims are per demo

Logos Messaging has no backend: the browser runs a light node and no server of
ours is in the path. Keep it that way and never route messaging through an API
route. Logos Blockchain and Logos Storage do read through a proxy, because their
endpoints aren't reachable from a browser (see
[network-access.md](network-access.md)), and their pages say so.

Add a proxy only when the alternative is no demo at all, and only for public,
read-only data: no keys, no user content, no writes. A proxy that starts
carrying anything user-specific is a different thing and needs its own
argument. Whatever a demo does, its page has to say it.

## Layout

[`src/demos/registry.ts`](../src/demos/registry.ts) is the demo catalogue. The
sidebar, the overview list, each demo's heading, its page metadata and the
sitemap all come from it, so adding a demo is one entry there plus a route at
its `href`. Never hardcode a demo into the sidebar.

Each demo has one route under `src/app/<demo>/`. `/` is the overview and lists
the demos and nothing else. `DemoShell` in `src/components/demo-shell.tsx` is
the sidebar shell; the root layout renders it, and it works out the active item
from `usePathname`.

A demo page has a heading, the demo and a Learn more button, and no explanatory
prose. How the thing works goes in `src/demos/<demo>/how-it-works.md`, which
`readExplainer` reads at build time and the dialog renders. Someone who wants to
play doesn't have to read first, and someone who wants detail gets more than a
paragraph. Explainers are plain markdown files so they stay easy to edit. Draw
diagrams as fenced mermaid blocks; `MermaidDiagram` imports mermaid lazily, so
it stays out of the page bundle.

Protocol code that doesn't depend on React lives in `src/lib/` and stays
framework-free, so it can move into a shared package unchanged. React state that
owns a node's lifetime lives in a hook under `src/components/`. Import
`@waku/sdk` lazily inside an effect (see
[waku-sdk-notes.md](waku-sdk-notes.md#import-it-lazily)). Validate everything
that arrives off the wire before rendering it, because topics are public and
other applications can publish to them.

## Diagrams stay narrow

The dialog column is about 840px wide. mermaid emits a `viewBox`, so a drawing
wider than its column is scaled down along with its text. One 1420px flowchart
rendered its 14px labels at 6px. Split a wide diagram and stack the parts
vertically instead.

- Lay comparisons out as stacked rows: `flowchart TB` with `direction LR` inside
  each subgraph. mermaid places two subgraphs with no edge between them side by
  side, so join them with an invisible link (`usual ~~~ here`) to force the
  stack.
- Keep sequence diagrams to three participants with short arrow labels. Label
  length sets the spacing between participants.
- Measure instead of eyeballing: compare each SVG's `viewBox` width with its
  rendered width. A ratio below about 0.95 means it's being shrunk, and the fix
  is a narrower diagram, not a smaller font.
- `MermaidDiagram` sets `useMaxWidth: false` for flowcharts and sequence
  diagrams so mermaid emits a pixel width, and `.mermaid-figure` scrolls. That
  is a backstop for the odd overflow. It doesn't make wide diagrams acceptable.

`LearnMoreDialog` is the modal pattern: React Aria `ModalOverlay`, `Modal` and
`Dialog`, `isDismissable` for click-outside, and a two-step close whose
`EXIT_MS` mirrors `--dialog-exit` in `globals.css`. If the two drift apart, the
panel disappears mid-animation.

## Metadata replaces, it does not merge

When a page sets `openGraph` or `twitter` in its metadata, Next replaces the
layout's object outright. Leave out `images` or `card` and the page loses its
share card without any warning, and the link previews as bare text.
`demoMetadata` in [`src/demos/metadata.ts`](../src/demos/metadata.ts) restates
both from the registry entry, and `e2e/metadata.spec.ts` checks every demo still
has them.

## Show the shape while waiting

Every demo reads a live network, so there is always a wait: four testnet nodes,
a roster fetch, a light node finding peers. A page that is blank and then
suddenly full looks broken and then startling. The placeholders are in
[`src/components/skeleton.tsx`](../src/components/skeleton.tsx). Make them
mirror the real layout instead of a generic box, and keep labels as real text.

A skeleton can't promise the final height, because a value of unknown length may
wrap. It does promise that the rows exist from the start, so the card settles
instead of unfolding. `e2e/loading.spec.ts` delays responses on purpose, since
locally they come back in well under a second.

## Verifying in a browser

Passing type checks tells you little here, because the demos depend on a live
peer-to-peer network. Check in a browser before you report a change as done.
For messaging, start the dev server and wait for the status panel to show
`Connected` with a non-zero peer count. Open a second tab and check that a
message crosses, then open a fresh tab and check that it loads the backlog from
Store. Peer discovery takes several seconds, so an empty page on first paint is
not yet a failure. To run the e2e suite against a deployment, see
[deployment.md](deployment.md#end-to-end-against-a-deployment).
