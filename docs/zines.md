# Zines

How the `/zines` catalogue and the per-issue readers at `/zines/<slug>` get their content and page assets. It covers the routes in [`apps/web/app/[locale]/zines/`](../apps/web/app/[locale]/zines/page.tsx), the reader in [`apps/web/components/sections/zines/`](../apps/web/components/sections/zines/zine-reader.tsx) and [`apps/web/lib/zines/`](../apps/web/lib/zines/reader-state.ts), the asset scripts in [`apps/web/scripts/`](../apps/web/scripts/generate-zine-assets.ts), the schemas and loaders in [`packages/content/src/schemas/zines.ts`](../packages/content/src/schemas/zines.ts) and [`packages/content/src/loaders/zines.ts`](../packages/content/src/loaders/zines.ts), and the data in [`content/zines/`](../content/zines/en/catalogue.json). Figma nodes and visual notes are in [components.md](components.md#zine-catalogue-and-reader).

Each readable issue opens in a reader with spreads, single pages, a page grid, a guided view, search, a contents panel and a print guide, and the original print PDF stays downloadable. There are no separate HTML article routes: the reader shows the printed pages. Catalogue, issue and print guide text comes from `content/zines/<locale>/`; the reader's own labels, status lines and error messages are in the `zines` namespace of `apps/web/messages/<locale>.json`.

## Catalogue

`content/zines/<locale>/catalogue.json` holds the page title, the description and the list of editions. The page splits the description into paragraphs on blank lines (`\n\n`) and joins them with spaces for the page metadata.

```ts
interface ZineEdition {
  slug: string // unique within the catalogue
  title: string
  date: string // shown under the cover
  cover: string // must start with /images/zines/
  href?: string // external URL, used only when reader is false
  reader: boolean // true: link to /zines/<slug> and build a reader page
}
```

An edition with `reader: true` links to its reader. Without a reader it links to `href` if it has one, and otherwise shows as a plain cover. All six current editions, from `reformatting` (May 2022) to `lan-02` (October 2026), have readers.

`ROUTES.zines` and `ROUTES.zine(slug)` build the paths. The sitemap lists the catalogue and every edition with `reader: true`, and the Explore menu links to the catalogue as `Zine` (`content/site/en/navigation.json`).

## Issue files

Each readable edition has `content/zines/<locale>/<slug>.json`, and its PDF is committed under `apps/web/public/zine/`.

```ts
interface ZineIssue {
  schemaVersion: 1
  language: Language
  slug: string
  title: string
  shortTitle: string // toolbar and contents panel heading
  edition: string // e.g. "Issue 02 · October 2026"
  description: string // page metadata
  pdf: string // /zine/<name>.pdf, served from apps/web/public/zine/
  trim: number // print bleed in PDF points, removed from every page
  pageCount: number // pages after spreads are split; must match the PDF
  pageNumberOffset?: -1 | 0 | 1 // printed folio = page index + offset
  pageTitles: Record<string, string> // page index -> title override
  textLayer?: boolean // use the reviewed OCR text layer
  printLayout?: 'pages' | 'spreads' // supplied PDF has facing pages per sheet
  imposedPdf?: string // optional ready-imposed print file
  sections: Array<{
    title: string
    entries: Array<{ title: string; page: number; startWord?: number }>
  }>
}
```

`getZineIssue` reads the file only when the slug belongs to a catalogue edition with `reader: true`. Any other slug, path traversal included, throws `ContentNotFoundError` and the route returns a 404. The file's `slug` and `language` must match the request.

Page `0` is the cover and the last page is the back cover, and contents entries must point to a page before the back cover. A page whose printed number would be `0` is labelled `Inside cover`. Search results and the guided view heading take a page's article title from `pageTitles` first, and otherwise from the last contents entry on or before that page. When two articles share a page, `startWord` on the second entry marks the word index where it begins.

## Reader

`ZineReader` is a client component. It fetches `/zines/generated/<slug>/document.json` and checks it against `zineDocumentSchema`, the issue's slug and its page count. While it loads, the reader shows a status line and the PDF download; if the load fails, it shows a failure message, a retry button and the PDF download. Without JavaScript, a `<noscript>` message links to the PDF. On reader pages `ZineChromeGate` hides the site header and footer; the catalogue keeps them.

| View      | What it shows                                                                                      |
| --------- | -------------------------------------------------------------------------------------------------- |
| `spreads` | The default. Facing pages side by side; the covers are never paired.                               |
| `pages`   | One page at a time. Up to 767px wide, `spreads` is shown as `pages`.                               |
| `grid`    | Every page as a thumbnail beside the contents. Picking one returns to spreads, or pages on mobile. |
| `guided`  | One reading block at a time, cropped from the page art, with a progress bar and the article title. |

On mobile, tapping a column opens guided view at that block, and the `Read in guided view` button opens it at the first block.

The previous and next arrows and the left and right arrow keys turn pages; in guided view they move by block and carry on to the next or previous page. Touch screens also take a horizontal swipe. On desktop a filmstrip shows thumbnails grouped by spread and marks pages with search hits, and on mobile a range slider replaces it. `Escape` closes the open panel and leaves guided view.

Text is selectable over the page images. A selection within one page offers `Copy` and `Copy link to passage`; the link encodes `page`, `start` and `end`, and the reader highlights that passage when the link is opened. PDF link annotations become clickable areas on the page.

Only one panel is open at a time: search, contents (sections and entries with printed page numbers, plus the PDF download) or the print guide. From 1100px wide down, search and contents overlay the page instead of sitting beside it.

## Search

The reader searches the words in `document.json`. Matching is case-insensitive and literal, and runs of whitespace in the query collapse to one space, so a phrase matches across words and lines. Queries are capped at 120 characters.

Each hit records its page and word range. A hit inside a reading block takes its snippet from that block only, so running headers don't leak into the passage; a hit outside any block, such as in a running header, takes context from the whole page. Results are grouped by page, with the first four pages shown and a `Show N more pages` button, and each page's representative hit prefers a passage over a header or title match. Selecting a result opens that page in spreads (pages on mobile) with the match highlighted.

Image-only and outlined-text issues have no usable PDF text, so they search a reviewed OCR text layer instead (see [OCR text layers](#ocr-text-layers)).

## Print guide

`content/zines/<locale>/print-guide.json` (`zinePrintGuideSchema`) holds numbered `steps`, a `shop` note and `spreadPrint`. For issues with `printLayout: 'spreads'` (currently `reformatting` and `nation-states`), `spreadPrint` replaces the body of the first step and explains how to split the facing pages before booklet printing. When `imposedPdf` is set, the guide also offers `Download A3 print layout`, with a note not to select booklet mode again; only Nation States has one.

## URL state

Reader state lives in the query string and is parsed by `readState` in [`apps/web/lib/zines/reader-state.ts`](../apps/web/lib/zines/reader-state.ts):

| Param         | Meaning                                                                        |
| ------------- | ------------------------------------------------------------------------------ |
| `page`        | Page index, clamped to the issue. Defaults to `0`.                             |
| `view`        | `spreads`, `pages`, `grid` or `guided`. Unknown values fall back to `spreads`. |
| `block`       | Reading block index in guided view.                                            |
| `q`           | Search query.                                                                  |
| `start`/`end` | Highlighted word range on `page`, from passage links and search hits.          |
| `panel`       | `search`, `contents`, `print` or `none`.                                       |

A `q` without `panel` opens search, except in guided view, and `panel=none` keeps a query active with the panel closed. `panel=print` keeps the print guide open while you change page, view or search. Typing a query replaces the current history entry and every other change pushes a new one, so back and forward step through the reader.

## Generated assets

`pnpm generate:zines` ([`apps/web/scripts/generate-zine-assets.ts`](../apps/web/scripts/generate-zine-assets.ts)) runs before `next dev`, and in `build:app` after `generate:media-assets` and before `next build`. For every readable edition it:

1. Reads the issue's PDF from `apps/web/public/zine/`.
2. Splits each sheet into pages: a landscape sheet becomes two facing pages, left then right. It removes `trim` from every edge.
3. Renders each page 1600px wide as `<n>.webp`, plus a 320px thumbnail as `<n>-thumb.webp`.
4. Extracts word positions and reading blocks from the PDF text with pdf.js. Running headers and folios stay selectable but are not reading blocks. Issues with `textLayer` use their reviewed text layer instead.
5. Turns `http(s)` and `mailto:` link annotations into page links, rewriting `forum.vac.dev` to `forum.research.logos.co`.
6. Writes `document.json`, with the PDF's SHA-256 as `sourceHash`.

The output goes to `apps/web/public/zines/generated/<slug>/`, which is gitignored and ends up in the static export. The script fails when the number of pages it produces doesn't match `pageCount`. `pdfjs-dist`, `@napi-rs/canvas` and `sharp` are dev dependencies; the browser only loads the static files. Image-only issues use JPEG 2000, which pdf.js decodes with its bundled WASM during generation ([`apps/web/scripts/zines/pdf-options.ts`](../apps/web/scripts/zines/pdf-options.ts)).

### Text measurement

[`apps/web/scripts/zines/extract-text.ts`](../apps/web/scripts/zines/extract-text.ts) places words by measuring each PDF text run on a `@napi-rs/canvas` context and scaling to the run's width. CI images may have no system fonts, so the script registers the Liberation Sans file that ships with `pdfjs-dist` (`pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf`) and measures with that. Generation fails if the font can't be registered or a run measures to a non-finite or non-positive width, rather than write invalid word coordinates.

### OCR text layers

`pioneering` and `open-source` set `textLayer: true`. Their words come from `apps/web/scripts/zines/text-layers/<slug>.json`, which is committed and has been reviewed by hand. These files are derived verbatim from the PDFs, not website copy, and OCR can still contain recognition errors; the rendered page is the visual source of truth. Generation fails if a layer's `sourceHash` or page count no longer matches the PDF, so replacing one of these PDFs means preparing its layer again.

To prepare a layer, install Tesseract with English language data and run:

```bash
pnpm --filter web exec tsx scripts/prepare-zine-text.ts <slug>
```

[`prepare-zine-text.ts`](../apps/web/scripts/prepare-zine-text.ts) renders each page at 3x and runs Tesseract twice, in paragraph mode (`--psm 3`) and sparse mode (`--psm 11`), keeping the sparse result when its confidence score is more than 15% higher. Tesseract is needed only for this editorial step, never for a deploy. **Running the script overwrites the committed layer, manual corrections included**, so reconcile any reviewed fixes afterwards. Then check search highlights and guided crops in the browser.

To fix an OCR spelling mistake, edit `pages[page].words[word].text` in the layer file; don't edit the generated `document.json`, which the next build overwrites. Page and word indices are zero-based and match `document.json`, while the folios printed in the reader may be offset by `pageNumberOffset`. For a text-only fix, keep the word order, word boxes and block ranges as they are. Structural repairs (deleting noise, joining words, fixing column order) also need updated block ranges and bounds. If you apply a list of fixes by index, check the current word text first, because the indices refer to one snapshot of the document. Check search highlights and guided crops after any structural repair.

## Tests

`apps/web/lib/zines/__tests__/` covers reader state and navigation, search, article titles on shared pages, PDF text extraction (including a subprocess run with system font loading disabled), page splitting, OCR parsing and the reviewed Open Source Everything text. `packages/content/src/loaders/__tests__/zines.test.ts` covers the catalogue, issues, page counts, slug rejection and the print guide.
