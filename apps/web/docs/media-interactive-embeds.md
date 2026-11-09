# Interactive media embeds

How `apps/web` isolates CMS-authored interactive embeds from the site origin while giving them the storage and frame size they would see on `logos.co`. The code is [`apps/web/lib/media-interactive-frame.ts`](../lib/media-interactive-frame.ts), [`apps/web/lib/media-interactive-document.ts`](../lib/media-interactive-document.ts), [`html-document-embed.tsx`](../app/[locale]/media/_components/html-document-embed.tsx) and [`media-rich-content.tsx`](../app/[locale]/media/_components/media-rich-content.tsx).

## Where embeds come from

Two kinds of media content render in `srcdoc` iframes with the `media-detail-interactive` class:

- `html_file` articles, rendered by `HtmlDocumentEmbed` from a full HTML document.
- Interactive embed blocks inside rich content, rendered by `SrcDocEmbed` in `media-rich-content.tsx`.

When this was written, only three `html_file` articles used this code (`browser-betrayed-you`, `dispersive-medium` and `logos-basecamp`), and no post used dynamic blocks.

## Sandbox

Both components set `sandbox={INTERACTIVE_FRAME_SANDBOX}`:

```text
allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms
```

There is no `allow-same-origin`, so embed scripts run in an opaque origin. They cannot read `logos.co` cookies or storage, reach `parent.document`, or remove the sandbox. With `allow-same-origin`, CMS-authored scripts ran as `logos.co`, and `browser-betrayed-you` wrote a `__test` cookie and `localStorage` keys on the site origin. `allow-popups-to-escape-sandbox` lets external links open in a normal, unsandboxed tab. A test asserts that the value never contains `allow-same-origin` or `allow-top-navigation`; keep it that way.

Because the parent cannot read the frame document, the work of styling, sizing and link handling happens in a script injected into the frame, which talks to the parent over `postMessage`.

## Building the article document

`buildInteractiveDocument(html, storage, size)` runs three steps:

1. `prepareCmsLinks` rewrites links in the authored HTML.
2. `injectEmbedCsp` adds the default embed CSP right after `<head>`, unless the article declares its own `Content-Security-Policy` meta tag. HTML without a `<head>` is wrapped in a full document. The `<head>` match ignores `<header>`.
3. The frame script (`interactiveFrameScript`) goes right after `<head>`, or after `<html>` or the doctype if there is no head, or at the very start. It always comes before any authored markup, so an article CSP that blocks inline scripts applies only after the frame script has run.

`storage` defaults to `DEFAULT_HOST_STORAGE` (everything allowed) and `size` is optional. Only numbers and the seven boolean storage flags are serialised into the script.

## What the frame script does

Inside the frame, the script:

- Keeps the frame from scrolling sideways. Content wider than the article column would otherwise add a horizontal scrollbar, which with classic scrollbars takes height from the frame, makes the article overflow vertically and traps the mouse wheel. Each time it measures the frame, the script checks whether the root is wider than the frame. If it is, every element that ends past the right edge and has `white-space: nowrap` gets `normal`, and one with `pre` gets `pre-wrap`, both `!important`, with `overflow-wrap: anywhere` and `box-decoration-break: clone` so inline tags keep their border on each line. An element is left alone when an ancestor below `body` has `overflow-x` set to `auto`, `scroll`, `hidden` or `clip`, such as ellipsis values or code blocks that scroll sideways. `body` and `html` are not checked. `overflow-x: hidden !important` on the root element stays as a backstop for content that cannot wrap, such as a wide image. `browser-betrayed-you` needs this: it puts whole sentences in `.s0-pd` tags styled `white-space: nowrap`, and without wrapping the end of the browser advice sentence was cut off.
- Sets `background: transparent !important` on `html` and `body`.
- Adds `noopener` and `noreferrer` to every link with `target="_blank"`, keeping any authored `rel` tokens.
- Measures the body and reports the height to the parent on load, resize, DOM mutation, body resize, sub-resource load and when fonts are ready. It posts only when the height changes, or when the parent sends a sync message.
- Intercepts plain left clicks on site links (an `href` starting with `/` but not `//` or `/\`, no `download`, no target other than `_self`, no modifier keys) and asks the parent to navigate. Every other link keeps its native behaviour.

## Messages

All messages are plain objects with a `type` field. The constants live in `media-interactive-frame.ts`.

| Type                         | Direction       | Payload  |
| ---------------------------- | --------------- | -------- |
| `logos-media-frame-height`   | frame to parent | `height` |
| `logos-media-frame-navigate` | frame to parent | `href`   |
| `logos-media-frame-sync`     | parent to frame | none     |

`observeInteractiveFrame(iframe, onHeight)` handles the parent side:

- It accepts messages only when `event.source` is this iframe's `contentWindow`.
- It rounds a height up and clamps it between 1 and 100000 px, so a broken embed cannot stretch the page forever. It ignores non-numeric heights, and ignores heights altogether when no `onHeight` is passed, as for an embed with a fixed height.
- It navigates only to same-origin paths. `//`, `/\`, absolute URLs and relative paths are rejected.
- It sends a sync message on connect and on every iframe `load`, because the frame may report its height before hydration attaches the listener. The frame accepts sync only from `window.parent`, then forgets its last height and measures and posts again.

`SrcDocEmbed` keeps its own height listener for `logos-media-embed-height` messages, and also checks that `event.source` is its own iframe.

## Storage mirroring

Articles should see the same storage support they would on `logos.co`, without anything they write reaching the site. After mount, `HtmlDocumentEmbed` calls `probeHostStorage(window)` on `logos.co`. The probe checks cookies, `navigator.cookieEnabled`, `localStorage`, `sessionStorage`, IndexedDB, the Cache API and service workers, using the `__logos_storage_probe` key and removing it again. The result is a `HostStorage` object that the frame script receives.

Inside the frame:

- Cookies, `localStorage` and `sessionStorage` work in memory for the life of the frame when the site allows them. When the site blocks them, cookie writes are ignored and the Web Storage getters throw a `SecurityError`.
- `navigator.cookieEnabled` matches the site, which can be `true` while cookie writes are blocked.
- IndexedDB, the Cache API and service workers are present or absent as on the site. Where the sandbox hides one the site has, a stand-in takes its place whose calls fail with `SecurityError`, as a sandboxed IndexedDB already does natively. Nothing throws on plain property access.

Nothing persists across reloads.

## Frame size

Chrome runs sandboxed frames in their own process, which may not know its size while the article's first scripts run, so `innerWidth` and `innerHeight` read 0. `HtmlDocumentEmbed` measures the iframe with `measureFrame` after mount and passes the size in. The frame then reports the measured size for `innerWidth` and `innerHeight` until the native values become non-zero. If nothing was measured, the native getters are left alone.

## Loading after hydration

The frame needs both the storage probe and the measured size, and only the browser knows them. `HtmlDocumentEmbed` therefore renders the iframe with no `srcDoc`, runs the probe and measurement in an effect, and sets `srcDoc` once. The article is not in the static HTML and loads once, after hydration. The article HTML is still in the RSC payload. The iframe starts at 480 px high until the first height message arrives. An embed with a fixed height keeps that height and ignores height messages.

## Testing

Run the unit and DOM tests:

```bash
pnpm --filter web exec vitest run lib/__tests__/media-interactive
```

Happy DOM does not run scripts inside iframes, so `media-interactive-frame-dom.test.ts` evaluates `interactiveFrameSource` against the frame window by hand. Happy DOM has no layout either, so the wrapping tests stub `clientWidth`, `scrollWidth` and `getBoundingClientRect` to make an element stick out of the frame.

To check in a browser, run `pnpm --filter web dev` and open `/media/article/browser-betrayed-you`, `/media/article/dispersive-medium` and `/media/article/logos-basecamp`:

1. Each article renders at full height with no inner scrollbar.
2. In `browser-betrayed-you`, "Viewport" shows the frame size rather than 0×0, and the storage demo reads "6 of 6", or "3 of 6" with all cookies blocked for the site.
3. In `browser-betrayed-you`, opened in Brave or Firefox with scrollbars set to "Always" on macOS, the "You appear to be using ..." tag wraps and nothing is cut off.
4. In DevTools, `document.querySelector('iframe.media-detail-interactive').contentDocument` returns `null`, and no `__test` cookie or new `localStorage` key appears on the site.
5. An external link in an article opens a normal, unsandboxed tab.
