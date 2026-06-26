# Field Guide — Design Spec

**Issue:** [logos-co/logos-web#65](https://github.com/logos-co/logos-web/issues/65) — Create and add Field Guide
**Date:** 2026-06-26
**Branch:** `feat/field-guide`

## Problem

The team built a standalone Logos Field Guide (a 16-chapter brand/comms guide) hosted at
`https://logos-brand-protocol.vercel.app/index.html`. It needs to live on the main site at
`logos.co/field-guide`, and be discoverable from:

- Footer → "Field Guide" (under "Brand Guidelines")
- Global nav → Resources → "Field Guide"

The reference site is a purpose-built reading experience: a left chapter sidebar, prev/next pager,
per-page reference label, and keyboard navigation (←/→). The content is prose-heavy: headings,
paragraphs, blockquotes, GFM tables, lists, keyboard hints, and inter-chapter links.

## Decisions

Confirmed with the user during brainstorming:

1. **Independent port** — preserve the guide's own reading experience (sidebar + pager), not a
   full re-build into marketing-page components, and not a link-out to the external site.
2. **Site header retained, guide chrome dropped** — keep the logos.co global nav header so the
   guide feels part of the site. Drop the reference site's own header (theme toggle, GitHub, print).
3. **Content stored as data in `content/`** — consistent with the existing content single-source
   approach; CMS-migratable later.
4. **Light theme only** — drop the reference site's Paper/Ink theme toggle; match logos.co's
   light design (`brand-dark-green` on light).

## Architecture

### Routing & build

- New route: `apps/web/app/[locale]/field-guide/[[...slug]]/page.tsx` (optional catch-all).
  - `/field-guide` → index chapter (`index`, num `00`)
  - `/field-guide/<slug>` → that chapter
- `generateStaticParams` enumerates all 16 chapter slugs across active locales — required because
  production builds with `output: 'export'` (static export, no server).
- Unknown slug → `notFound()`.
- `constants/routes.ts`: add `fieldGuide: '/field-guide'`. All hrefs reference this constant.
- `app/sitemap.ts`: add the field-guide index + every chapter path to the indexable routes.

### Content storage (`content/field-guide/en/`)

- `manifest.json` — the table of contents and guide metadata:
  - guide `title`, `version`
  - `sections`: ordered list of `{ section, items: [{ slug, num, title }] }`
  - This is the single source for the sidebar, pager order, page-ref label, and
    `generateStaticParams`.
- `chapters/<slug>.md` — one Markdown file per chapter (16 files). Bodies are ported from the
  reference site's HTML, converted to GFM Markdown (tables, blockquotes, lists, `kbd` via inline
  code or HTML, inter-chapter links rewritten to `/field-guide/<slug>`).

Storing bodies as Markdown (not block-JSON) keeps porting faithful and low-friction, and
`react-markdown` + `remark-gfm` are already dependencies in `apps/web`.

### Content package (`packages/content`)

- `src/schemas/field-guide.ts` — zod schema for `manifest.json`
  (`fieldGuideManifestSchema`, with `schemaVersion`, `language`, guide meta, sections/items).
- `src/loaders/field-guide.ts`:
  - `getFieldGuideManifest(locale)` — reads + validates `manifest.json`.
  - `getFieldGuideChapter(locale, slug)` — reads the chapter Markdown; throws
    `ContentNotFoundError` for unknown slugs (so the route can `notFound()`).
  - `getFieldGuideSlugs(locale)` — flat slug list for `generateStaticParams`.
- `src/loaders/_fs.ts` — add a `readText(filePath)` helper (mirrors `readJson`, returns the raw
  string, throws `ContentNotFoundError` on ENOENT).
- Export new loaders/schema from the package barrels.

### Rendering components (`apps/web/components/sections/field-guide/`)

- `FieldGuideShell` (client component) — the reading layout:
  - left sidebar: TOC grouped by section, with chapter number + title, active item highlighted
  - main column: the rendered chapter + a page-ref eyebrow (`<num> · <title>`)
  - bottom pager: prev / next chapter links derived from manifest order
  - mobile: hamburger toggles the sidebar (backdrop overlay)
  - keyboard: ←/→ navigate between chapters (ignored while focus is in an input)
- `FieldGuideContent` — wraps `react-markdown` (+ `remark-gfm`) with a component map binding
  Markdown elements (`h1`–`h3`, `p`, `table`/`thead`/`tbody`/`tr`/`th`/`td`, `blockquote`,
  `ul`/`ol`/`li`, `hr`, `code`, `a`) to logos.co design tokens. Internal links
  (`/field-guide/...` and other site routes) render via the i18n `Link`; external links open in a
  new tab with `rel="noopener"`.

The page component (server) loads the manifest + the requested chapter, resolves prev/next, and
renders `FieldGuideShell` with `FieldGuideContent` inside. The global `SiteHeader` already wraps
all `[locale]` pages; no guide-specific header is added.

### Link integration

- `content/site/en/footer.json` → `mainLinks`: add `{ "label": "Field Guide", "href": "/field-guide" }`
  immediately after "Brand Guidelines".
- `content/site/en/navigation.json` → "Explore" panel → "Resources" `links`: add
  `{ "label": "Field Guide", "href": "/field-guide" }` next to "Brand Kit".

### Metadata

- `messages/en.json` → `pages.fieldGuide`: title + description for SEO.
- Per-chapter `<title>` uses the chapter title from the manifest
  (`<Chapter title> — Logos Field Guide`).

## Testing

- `packages/content`: unit tests for the field-guide schema (valid/invalid manifest) and loader
  (manifest load, chapter load, unknown-slug → `ContentNotFoundError`).
- Integrity test: every `manifest.json` item has a matching `chapters/<slug>.md`, and no orphan
  Markdown files exist.
- Component: `FieldGuideContent` renders Markdown elements with the mapped components; internal
  links use the i18n `Link`.

## Out of scope

- CMS (Strapi) modelling — content lives as files now; migration is a later step.
- Localisation beyond English — content is English-only; the route renders the same content under
  every active locale (matching how other content-driven pages behave today).
- Paper/Ink theme toggle, print, and GitHub chrome from the reference site.
