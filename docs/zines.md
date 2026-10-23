# Zines

The `/zines` page lists the Logos zines. Each readable edition opens in an in-browser reader at `/zines/<slug>` with spreads, single pages, a page grid, guided reading, search, a contents panel and a print guide. The original print PDFs stay downloadable.

**Catalogue route:** [`apps/web/app/[locale]/zines/page.tsx`](../apps/web/app/[locale]/zines/page.tsx) (`ROUTES.zines`)
**Reader route:** [`apps/web/app/[locale]/zines/[slug]/page.tsx`](../apps/web/app/[locale]/zines/[slug]/page.tsx) (`ROUTES.zine(slug)`)
**Reader components:** [`apps/web/components/sections/zines/`](../apps/web/components/sections/zines/zine-reader.tsx)
**Content:** [`content/zines/en/`](../content/zines/en/catalogue.json)
**Schemas and loaders:** [`packages/content/src/schemas/zines.ts`](../packages/content/src/schemas/zines.ts), [`packages/content/src/loaders/zines.ts`](../packages/content/src/loaders/zines.ts)

The catalogue and every edition with `reader: true` are in the sitemap. The Explore menu links to the catalogue as `Zine` (`content/site/en/navigation.json`).

---

## 1. Catalogue

`content/zines/<locale>/catalogue.json` holds the page title, the description and the list of editions. The description is split into paragraphs on blank lines (`\n\n`). For the page metadata the paragraphs are joined with spaces.

Each edition:

```ts
interface ZineEdition {
  slug: string
  title: string
  date: string // shown under the cover
  cover: string // must start with /images/zines/
  href?: string // external URL, used only when reader is false
  reader: boolean // true: link to /zines/<slug> and build a reader page
}
```

Slugs must be unique within the catalogue. An edition with `reader: true` links to its reader. An edition without a reader links to `href` if it has one. Otherwise it shows as a plain cover.

Current editions, all with readers:

| Slug            | Title                                  | Date           |
| --------------- | -------------------------------------- | -------------- |
| `lan-02`        | Local Area Network - Issue 02          | October 2026   |
| `lan-01`        | Local Area Network - Issue 01          | September 2026 |
| `pioneering`    | Pioneering a New Era of Freedom        | March 2026     |
| `nation-states` | Nation States Are Obsolete             | February 2026  |
| `open-source`   | Open Source Everything                 | October 2025   |
| `reformatting`  | A Simple Guide to Reformatting Society | May 2022       |

---

## 2. Issue files

Each readable edition has `content/zines/<locale>/<slug>.json`. `getZineIssue` reads the file only when the slug belongs to a catalogue edition with `reader: true`. Any other slug, including path-traversal attempts, throws `ContentNotFoundError`, and the route returns a 404. The file's `slug` and `language` must match the request.

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
  textLayer?: boolean // use the reviewed OCR text layer (see section 7)
  printLayout?: 'pages' | 'spreads' // supplied PDF has facing pages per sheet
  imposedPdf?: string // optional ready-imposed print file
  sections: Array<{
    title: string
    entries: Array<{ title: string; page: number; startWord?: number }>
  }>
}
```

- Contents entries must point to a page before the back cover.
- Page `0` is the cover and the last page is the back cover. A page whose printed number would be `0` is labelled `Inside cover`.
- The article title for a page, as shown in search results and the guided view heading, comes from `pageTitles` first. Otherwise it is the last contents entry on or before that page. `startWord` lets two articles share a page: words from that index onward belong to the second entry.

---

## 3. Reader

`ZineReader` is a client component. It fetches `/zines/generated/<slug>/document.json` and checks it against `zineDocumentSchema`, the issue's slug and its page count. While loading it shows a status message and the PDF download. If the load fails, it shows a failure message, a retry button and the PDF download. Without JavaScript, a `<noscript>` message links to the PDF.

On reader pages, `ZineChromeGate` hides the site header and footer. The catalogue keeps them.

### Views

| View      | Behaviour                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------ |
| `spreads` | Default. Facing pages side by side. The covers are never paired.                                        |
| `pages`   | One page at a time. On viewports up to 767px wide, `spreads` is shown as `pages`.                      |
| `grid`    | Every page as a thumbnail beside the contents. Selecting a page returns to spreads, or to pages on mobile. |
| `guided`  | One reading block at a time, cropped from the page, with a progress bar and the article title.         |

On mobile, tapping a column on a page opens guided view at that block. The `Read in guided view` button opens it at the first block.

### Navigation

- Previous and next arrows, and the left and right arrow keys. In guided view these move by block and continue onto the next or previous page.
- Horizontal swipe on touch screens.
- The desktop filmstrip shows thumbnails grouped by spread and marks pages with search hits. On mobile, a range slider moves between pages.
- `Escape` closes the open panel and leaves guided view.
- Text can be selected over the page images. Within a single page, a selection offers `Copy` and `Copy link to passage`. The link encodes `page`, `start` and `end`, and the passage is highlighted when the link is opened.
- PDF link annotations become clickable areas on the page.

### Panels

Only one panel is open at a time.

- **Search** -- see section 4.
- **Contents** -- the issue's sections and entries with printed page numbers, plus the PDF download.
- **Print guide** -- see section 5.

From 1100px wide down, the search and contents panels overlay the page instead of sitting beside it.

---

## 4. Search

The reader searches the text in `document.json`:

- Matching is case-insensitive. Runs of whitespace in the query collapse to one space, so phrases match across words and lines. Special characters are matched literally. Queries are capped at 120 characters.
- Each hit records its page and word range. When the hit falls inside a reading block, its snippet is clipped to that block, so running headers do not leak into passages. Hits outside any block, such as in running headers, take context from the whole page.
- Results are grouped by page, with the first four pages shown and a `Show N more pages` button. Each page's representative hit prefers a passage over a header or title match.
- Selecting a result opens that page in spreads (pages on mobile) with the match highlighted.

Image-only and outlined-text editions have no usable PDF text. They search reviewed OCR text instead (see section 7).

---

## 5. Print guide

`content/zines/<locale>/print-guide.json` (`zinePrintGuideSchema`) holds numbered `steps`, a `shop` note and `spreadPrint`.

- For issues with `printLayout: 'spreads'`, the body of the first step is replaced by `spreadPrint`, which explains how to split the facing pages before booklet printing.
- When `imposedPdf` is set, the guide also offers `Download A3 print layout` with a note not to select booklet mode again. Nation States uses this.

---

## 6. URL state

Reader state lives in the query string and is read through `readState` (`apps/web/lib/zines/reader-state.ts`):

| Param         | Meaning                                                                    |
| ------------- | -------------------------------------------------------------------------- |
| `page`        | Page index, clamped to the issue. Defaults to `0`.                         |
| `view`        | `spreads`, `pages`, `grid` or `guided`. Unknown values fall back to `spreads`. |
| `block`       | Reading block index in guided view.                                        |
| `q`           | Search query.                                                              |
| `start`/`end` | Highlighted word range on `page` (passage links and search hits).          |
| `panel`       | `search`, `contents`, `print` or `none`.                                   |

A `q` without `panel` opens search, except in guided view. `panel=none` keeps a query active with the panel closed. `?panel=print` restores the print guide independently of page, view and search. Typing a query replaces the history entry. Other changes push a new one, so back and forward step through the reader.

---

## 7. Generated assets

`pnpm generate:zines` (`apps/web/scripts/generate-zine-assets.ts`) runs before `next dev` and during `build:app`, after `generate:media-assets` and before `next build`. For every readable edition it:

1. Reads the issue's PDF from `apps/web/public/zine/`.
2. Splits each sheet into pages. Landscape sheets become two facing pages, left then right. `trim` is removed from every edge.
3. Renders each page at 1600px wide as `<n>.webp` and a 320px thumbnail as `<n>-thumb.webp`.
4. Extracts word positions and reading blocks from the PDF text with pdf.js. Running headers and folios stay selectable but are not reading blocks. For `textLayer` issues it uses the reviewed text layer instead (see below).
5. Converts `http(s)` and `mailto:` link annotations into page links. Links to `forum.vac.dev` are rewritten to `forum.research.logos.co`.
6. Writes `document.json`, with the PDF's SHA-256 as `sourceHash`.

Output goes to `apps/web/public/zines/generated/<slug>/`, which is gitignored. The script fails when the number of pages produced does not match `pageCount`. The dev dependencies are `pdfjs-dist`, `@napi-rs/canvas` and `sharp`.

### Text measurement

Word positions are found by measuring each PDF text run on a `@napi-rs/canvas` context and scaling to the run's width (`apps/web/scripts/zines/extract-text.ts`). Measurement does not depend on system fonts, which CI images may lack: the script registers the Liberation Sans font shipped with `pdfjs-dist` (`pdfjs-dist/standard_fonts/LiberationSans-Regular.ttf`) and measures with it. Generation fails if the font cannot be registered or if a run measures to a non-finite or non-positive width, rather than writing invalid word coordinates.

### OCR text layers

`pioneering` and `open-source` set `textLayer: true`. Their text comes from `apps/web/scripts/zines/text-layers/<slug>.json`, which is committed and has been reviewed by hand. Generation fails if the layer's `sourceHash` or page count no longer matches the PDF, so replacing one of these PDFs means preparing its text layer again.

`apps/web/scripts/prepare-zine-text.ts <slug>`, run with `tsx`, prepares a layer. It renders each page at 3x and runs Tesseract twice, in paragraph mode (`--psm 3`) and sparse mode (`--psm 11`). It keeps the sparse result when its confidence score is more than 15% higher. This is an editorial step only. Tesseract must be installed locally but is not a deployment dependency. Re-running the script overwrites the committed layer, including any manual corrections.

---

## 8. Copy

Reader chrome uses the `zines` namespace in `apps/web/messages/<locale>.json`. This covers view names, controls, status lines, search, copy notices, print guide labels and loading or failure messages. Catalogue, issue and print guide text comes from `content/zines/<locale>/`.

---

## 9. Tests

- `apps/web/lib/zines/__tests__/` -- reader state and navigation, search, article titles on shared pages, PDF text extraction (including a subprocess run with system font loading disabled), page splitting, OCR parsing and the reviewed Open Source Everything text.
- `packages/content/src/loaders/__tests__/zines.test.ts` -- catalogue, issues, page counts, slug rejection and the print guide.
