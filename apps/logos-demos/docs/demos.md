# Demo structure and conventions

How demos in `apps/logos-demos` are put together, and the conventions that keep
their claims honest. Code covered: `src/demos/*`, `src/app/*`,
`src/components/*`.

## Claims are per demo, not app-wide

Logos Messaging genuinely has no backend: the browser is a light node and no
server of ours is in the path. Keep it that way, and never route messaging
through an API route. Logos Blockchain and Logos Storage do have a proxy in the
path, because the endpoints they read are not reachable from a browser, and
their pages say so plainly. See [network-access.md](network-access.md).

A proxy is allowed only where the alternative is no demo at all, and only for
public, read-only data: no keys, no user content, no writes. If a proxy starts
carrying anything user-specific it is a different thing and needs its own
argument. Whatever a demo does, its page must say it.

## Layout

`src/demos/registry.ts` is the demo catalogue and the single source of truth for
the sidebar, the overview list, and each demo's heading. Adding a demo means one
entry there plus a route at its `href`. Never hardcode a demo into the sidebar.

One demo per route under `src/app/<demo>/`. `/` is the overview, which lists the
demos and nothing else. `DemoShell` in `src/components/` is the sidebar shell,
rendered from the root layout, and derives the active item from `usePathname`.

A demo page carries no explanatory prose. It is a heading, the demo, and a Learn
more button. Everything about how the thing works belongs in that demo's
`src/demos/<demo>/how-it-works.md`, read at build time by `readExplainer` and
rendered into the dialog. A visitor who wants to play is not made to read
first, and a visitor who wants the detail gets more than a paragraph.

Explainers are real `.md` files so they stay editable as markdown. Use fenced
mermaid code blocks for diagrams; `MermaidDiagram` lazy-imports mermaid so it
never lands in the page bundle.

Protocol code that does not depend on React lives in `src/lib/`, kept
framework-free so it can move into a shared package unchanged. React state that
owns a node's lifetime lives in a hook under `src/components/`. Import
`@waku/sdk` lazily, inside an effect (`await import('@waku/sdk')`); it reaches
for browser APIs that do not exist during server rendering and pulls in libp2p.
Validate everything arriving off the wire before rendering it: topics are
public and other applications may publish there.

## Diagrams stay narrow

The dialog column is about 840px. mermaid emits a `viewBox`, so a drawing wider
than its column gets scaled down with its text: a 1420px flowchart rendered its
14px labels at 6px and was unreadable. A wide diagram must be split and stacked
vertically, never left to run wide.

- Lay comparisons out as stacked rows (`flowchart TB` with `direction LR` inside
  each subgraph), not side by side. Two subgraphs with no edge between them are
  independent roots and mermaid places them side by side, so join them with an
  invisible link (`usual ~~~ here`) to force the stack.
- Keep sequence diagrams to three participants and short arrow labels. Label
  length drives participant spacing.
- Measure rather than eyeball: compare each SVG's `viewBox` width against its
  rendered width. Below about 0.95 means it is being shrunk; the fix is a
  narrower diagram, not a smaller font.
- `useMaxWidth: false` is set for flowcharts and sequence diagrams so mermaid
  emits a pixel width, and `.mermaid-figure` scrolls. That is a backstop, not a
  licence to draw wide.

`LearnMoreDialog` is the modal pattern: React Aria `ModalOverlay`/`Modal`/
`Dialog`, `isDismissable` for click-outside, and a two-step close whose
`EXIT_MS` mirrors `--dialog-exit` in the stylesheet. Keep those two in step, or
the panel is torn out mid-animation.

## Metadata replaces, it does not merge

A page that sets `openGraph` or `twitter` in its metadata replaces the layout's
object outright. Miss `images` or `card` and the page silently stops carrying a
share card; the link just previews as bare text. `demoMetadata` in
`src/demos/metadata.ts` restates them for that reason, and
`e2e/metadata.spec.ts` checks every demo still has them.

Titles, descriptions and the sitemap all come from `src/demos/registry.ts`, so a
new demo needs an entry there and nothing else.

## Show the shape while waiting

Every demo reads a live network, so there is always a wait: four testnet nodes,
a roster fetch, a light node finding peers. Blank then suddenly full reads as
broken then startling. `src/components/skeleton.tsx` holds the placeholders:
mirror the real layout rather than a generic box, and keep labels as real text.

A skeleton cannot promise identical height: a value of unknown length may wrap.
It promises the rows exist from the start, so the card settles instead of
unfolding. `e2e/loading.spec.ts` delays the responses on purpose, because
locally they answer in well under a second.

## Verifying in a browser

Type-checking passing is not the same as the demo working; these demos depend on
a live peer-to-peer network, so verify in a browser before reporting done. For
messaging: start the dev server, wait for the status panel to report
`Connected` with a non-zero peer count, open a second tab and confirm a message
crosses, then confirm a freshly opened tab loads the backlog from Store. Peer
discovery takes several seconds, so a page that looks empty on first paint is
not yet a failure. For the e2e suite against a deployment, see
[deployment.md](deployment.md).
