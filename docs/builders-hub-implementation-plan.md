# Builders Hub Frontend — Implementation Plan

This plan lands the three Builders Hub pages on top of the
loader-driven `@repo/content` package and proves the GitHub-repo-based
content workflow end-to-end.

## 0. Goals

1. **Pixel-perfect Figma parity** on desktop and mobile for all three
   pages — never improvise, dump the Figma spec first, then implement,
   then verify with screenshots.
2. **All copy and structured data flow through `@repo/content`** —
   not a single user-facing string is hard-coded. Editors can change
   any title, eyebrow, CTA, RFP/Idea record by editing JSON in the
   repo (or, later, through the CMS PR flow).
3. **Reuse the existing design system.** No new typography scale, no
   new color tokens, no new spacing values. If something is missing,
   stop and surface it.
4. Demonstrate that a content editor changing a fixture in
   `content/builders-hub/**` produces the expected change on the page
   with no code edit.

## 1. Pages and Figma Sources

File: `qpsaED5iVKrOXoxwCWXuN3` (Logos).

| Page | Route | Figma desktop | Figma mobile |
|---|---|---|---|
| Builders Hub home | `/builders-hub` | `40009046-23948` | `40009046-23764` |
| Ideas listing | `/builders-hub/ideas` | `40009046-24754` | `40009046-24678` |
| RFPs listing | `/builders-hub/rfps` | `40009046-25012` | `40009046-24924` |

For the MCP `get_design_context` calls, convert each `40009046-NNNNN`
to `40009046:NNNNN` (Figma URL → API form). Pagination subroutes
(`/page/[n]`) reuse the listing layout — no separate Figma node.

## 2. Data Already in Place

Loaders (`packages/content/src/loaders/builders-hub.ts`):

- `getBuilderHubSettings(locale)` — hero, overview links, RFPs/ideas
  section settings, app-install giant switch, action panels, office
  hours, resources section heading.
- `resolveBuilderHubHomeRfps(locale)` — pinned + filler items, plus the
  "see all" terminator card with up to 4 thumbnail slugs already
  resolved.
- `resolveBuilderHubHomeIdeas(locale)` — pinned + filler.
- `getAllRfps({ locale, status?, limit? })` and `getAllIdeas(...)` —
  canonical sort (order ASC → publishedAt DESC → slug).
- `getRfpBySlug` / `getIdeaBySlug`.
- `getBuilderResources({ locale, status? })` — resource card list.
- `getBuilderHubListingSettings({ page: 'ideas' | 'rfps', locale })` —
  pageSize, defaultView, bottomCta.

Fixtures already authored:

- `content/builders-hub/settings/en.json`
- `content/builders-hub/listings/{ideas,rfps}/en.json`
- `content/builders-hub/rfps/{secure-decentralised-frontends, build-a-dex, integrate-fileverse}/{index,en}.json`
- `content/builders-hub/ideas/{quadratic-voting, community-bank, permissionless-dns}/{index,en}.json`
- `content/builders-hub/resources/en.json`
- `content/pages/en/builders-hub.json` — page-level SEO + heading.

If Figma reveals a field the schemas don't model, we add it before
coding the component (schema → fixture → loader → component, in that
order).

## 3. Route Structure

```
apps/web/app/[locale]/builders-hub/
├── page.tsx                       # home
├── ideas/
│   ├── page.tsx                   # listing page 1
│   └── page/[n]/page.tsx          # paginated
└── rfps/
    ├── page.tsx                   # listing page 1
    └── page/[n]/page.tsx          # paginated
```

- `generateStaticParams` on `page/[n]` enumerates `2..ceil(total/pageSize)`
  per active locale (loader gives total).
- View toggle (`grid` / `list`) is a search param on the listing page;
  it does **not** change the static set of generated pages.

## 4. Component Inventory

### 4.1 Reuse from existing design system

- Header / footer — already loader-driven.
- Eyebrow + heading patterns — `apps/web/components/sections/shared/*`.
- Card-grid primitives, button / link styles, container widths from
  `@acid-info/logos-ui` tokens.

### 4.2 New, scoped to Builders Hub

Under `apps/web/components/sections/builders-hub/`:

- `builders-hub-hero.tsx` — title, description, eyebrow,
  optional back link / top-right CTA.
- `builders-hub-overview-links.tsx` — 5 cards (RFPs, Ideas, Resources,
  Office Hours, App Install) wired from `overviewLinks`.
- `builders-hub-rfps-section.tsx` — section header + RFP card grid +
  terminator "see all" card. Card component:
  `rfp-card.tsx` (cover image stack, title, status, reward, slug link).
- `builders-hub-ideas-section.tsx` — section header + ideas table or
  list. Item component: `idea-row.tsx`.
- `builders-hub-app-install.tsx` — giant switch banner (image L/R,
  accent grey/yellow).
- `builders-hub-action-panel.tsx` — image-overlay or flat variant.
- `builders-hub-office-hours.tsx`.
- `builders-hub-resources.tsx` — resource cards from
  `getBuilderResources`.

For the listing pages:

- `rfps-listing.tsx` / `ideas-listing.tsx` — accept `items`,
  `pagination`, `view`, `bottomCta`; render header, view toggle,
  list/grid, paginator.
- `view-toggle.tsx` — grid/list pill.
- `paginator.tsx` — generic.

All section components are server components that accept already-
resolved props; client subtrees only for the view toggle and any
hover-driven UI.

## 5. Build Phasing

For each page we follow the same loop, in this order:

1. **Dump Figma spec** — call `mcp__plugin_figma_figma__get_design_context`
   for the desktop node, then the mobile node. Extract: typography
   (font, size, weight, line-height, letter-spacing), fills, gaps,
   padding, sizes, borders, breakpoints. Record decisions in a short
   note next to the implementation file if non-obvious.
2. **Confirm fixtures cover every visible string and asset.** If a
   field is missing, extend the schema + fixture first. If an asset
   (icon, illustration) is missing from `/public/**` or `@acid-info/logos-ui`,
   stop and ask the user for an export.
3. **Implement desktop layout** with the existing token system. No
   custom font sizes or colors that aren't in the token table.
4. **Implement mobile layout** as a separate set of utility classes on
   the same component (mobile-first; desktop overrides at `lg:`).
5. **Screenshot diff.** Run dev server, compare with the Figma
   screenshot at both breakpoints. Iterate until parity.
6. **Validate workflow.** Edit the fixture (e.g. change RFP title or
   reward) and confirm the page reflects the change without any code
   edit.

Order:

1. Builders Hub home (largest surface; exercises 8 component types).
2. RFPs listing — adds card-grid + view toggle + pagination.
3. Ideas listing — adds list/table view; reuses pagination + toggle.

## 6. Workflow Validation Checklist

Once all three pages are in place:

- [ ] Edit `content/builders-hub/settings/en.json` `hero.title`,
      reload `/builders-hub`, see the new title.
- [ ] Add a fourth RFP slug folder, set its `order` to pin it,
      regenerate — appears on home and listing.
- [ ] Change `listings/rfps/en.json` `pageSize` from 12 to 6,
      `generateStaticParams` produces twice as many `/page/[n]` routes.
- [ ] Toggle an RFP's `status` from `open` to `archived` — drops out
      of the default listing, still reachable by slug.
- [ ] French + Korean: add `fr.json` / `ko.json` for one RFP, set
      `NEXT_LOCALES=en,fr,ko`, build, confirm route generation per
      locale.
- [ ] Run `pnpm --filter @repo/content validate` — still 31/31 ok.

## 7. Out of Scope (deferred)

- Detail pages for individual RFPs / ideas (`/builders-hub/rfps/[slug]`).
  Cards link to placeholders for now; the detail-page layout lives in a
  follow-up plan.
- The "Submit an idea" / "Submit a proposal" forms — these go through a
  separate flow (likely a Payload form collection or external link).
- Additional Admin workflow polish beyond the save-to-PR flow — not required
  for the validation goals above.

## 8. Verification Gates Before "Done"

1. `pnpm --filter @repo/content validate` passes.
2. `pnpm --filter web check-types` passes.
3. `pnpm --filter web lint` passes.
4. Dev server renders each page without console errors at desktop and
   mobile widths.
5. Side-by-side screenshot comparison with Figma at both breakpoints.
6. Workflow checklist (§6) all green.
