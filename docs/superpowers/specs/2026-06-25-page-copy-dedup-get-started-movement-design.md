# Page Copy De-duplication — get-started & movement (Design Spec)

- **Date:** 2026-06-25
- **Branch:** `refactor/page-copy-single-source`
- **Status:** Approved (decisions locked below)
- **Follows:** the home page-copy single-source work already on this branch (`docs/superpowers/specs/2026-06-25-page-copy-single-source-design.md`). Same ownership contract and render-invariance discipline.

---

## 1. Problem

After the home migration, `messages.home` is gone, but a site-wide scan found residual cross-store copy duplication. Two pages are still **dual-sourced** — their own copy is split across next-intl `messages.pages.*` (prose) and `@repo/content` (structured records that happen to repeat some of the same strings):

- **get-started** renders prose from `messages.pages.getStarted` and structured data from `content/builders-hub/*`. Nine strings appear in both stores (the same copy the builders-hub home renders from `content/builders-hub/settings.build`).
- **movement** renders prose from `messages.pages.movement` and structured data from `content/circles/*`. Seven strings appear in both stores (circle initiative titles, circle CTAs).

This violates the single-source ownership contract for these two pages.

---

## 2. Decisions (locked)

1. **Duplication target = cross-store only.** No string may live in **both** `messages` and `@repo/content`. Two content files repeating the same label (content↔content) is acceptable.
2. **Migrate the two dual-sourced pages' prose to content.** `get-started` and `movement` page copy moves from `messages.pages.*` into new `content/pages/en/*.json` Pages docs; the corresponding `messages.pages` keys are deleted.
3. **Accepted as NOT duplication (left as-is):**
   - Short shared UI labels / URLs that recur across surfaces ("View the docs", "Run a node", "Join a circle", "Work With Us", "Terms & Conditions", shared link URLs) — shared chrome per the ownership contract; canonical copy stays in `messages`.
   - **Incidental cross-page matches** where each page is itself single-sourced: `messages.pages.nodeProgramme.useCases.items[4].body` ("Resilient, private messaging…") coincidentally equals home's `useCases.secure.body`; `messages.pages.technologyStack` and `content` both contain the title "The Logos Technology Stack". Fixing these would couple unrelated pages or force rewording — over-engineering. Same logic as accepting content↔content reuse.
4. **Storage:** new `content/pages/en/get-started.json` and `content/pages/en/movement.json` as Pages docs (`pageCopySchema`), read via `getPageCopy` + `findSection` (home pattern). Structured-record loaders are kept unchanged and run in parallel.
5. **Render output unchanged** (byte-identical), verified against `master`. Pure data-source swap.
6. **Commits:** few logical commits (content; web get-started; web movement + messages cleanup); consolidate before PR. No `Co-Authored-By: Claude`.

Out of scope: tech-stack detail pages, basecamp, node-programme, research, blog/media, podcast, book, manifesto, work-with-us, site nav/footer chrome, and all other `messages.pages.*` namespaces (they remain single-sourced in messages).

---

## 3. Current State — Verified Inventory (2026-06-25)

### 3.1 get-started

- Route component `apps/web/app/[locale]/get-started/page.tsx`: loads `getTranslations({namespace:'pages.getStarted'})` (→ `t`, a `GetStartedTranslator`), `getBuilderHubSettings(locale)`, `resolveBuilderHubHomeRfps(locale)`. Renders `<GetStartedPage t={t} basecampInstall={settings.prepare} developerPrograms={settings.programs} rfps={…} />`.
- `_sections/get-started-page.tsx` composes: `Hero({heading,intro})`, `Install({t, data:prepare})`, `Docs({t})`, `Programs({data:programs, rfps})`, `Community({t})`. (`Build` is imported-commented / hidden.)
- `messages.pages.getStarted` keys: `title`, `description`, `heading`, `intro`, `sections.{install, docs, community, build}`.
- Prose rendered from `t`: hero heading/intro, install section labels, docs items, community. Structured data (install steps, programs, rfps) come from content already.
- Metadata: `generateMetadata = createTranslatedPageMetadata({ namespace: 'pages.getStarted', path: ROUTES.getStarted })` → reads `messages.pages.getStarted.title/description`.
- The 9 cross-store strings live at `messages.pages.getStarted.sections.docs.items.*` ↔ `content/builders-hub/settings.build.cards.*` (the latter rendered by builders-hub home via `builders-hub-home.tsx`).

### 3.2 movement

- Route component `apps/web/app/[locale]/movement/page.tsx`: loads `getTranslations({namespace:'pages.movement'})` + `getCirclesSettings`, `getActiveCircleMarkers`, `getUpcomingCircleEvents`, `getCircleInitiatives`, `getCircleResources`. Renders `<MovementPageView t={t} circlesSettings=… mapMarkers=… upcomingEvents=… initiatives=… resources=… locale=… />`.
- `messages.pages.movement` keys: `title`, `description`, `heading`, `hero`, `intro`, `actions{activism,coalition,building}`, `campaign`, `find`, `map{zoomIn,zoomOut}`, `activism{…,cards}`, `events{…,day1..3,card}`, `involved`, `coalition`, `builder{…,feature,details}`, `resources{…,rows}`.
- Movement is the larger surface (14 prose groups) with deeply threaded `t` across `components/sections/movement/*`.
- Metadata: `createTranslatedPageMetadata({ namespace: 'pages.movement', path: ROUTES.movement })`.
- 7 cross-store strings ↔ `content/circles/*` (initiative titles like "Social-DeFi Fundraising", "Digital IDs Knowledge Hub"; CTAs "Find a circle near you", "Start your own Circle", etc.).
- **Coupled test:** `content-route-contracts.test.ts` asserts `messages.pages.movement.builder` (Benin fundraising feature/details). This must move with the migration.

### 3.3 Sole consumers

Only the two `page.tsx` files reference the namespaces (`NAMESPACE = 'pages.getStarted'|'pages.movement'`) — via `getTranslations` and `createTranslatedPageMetadata`. No other component reads them directly. `messages.pages.nodeProgramme.signup` is separate and stays.

---

## 4. Target State

1. `content/pages/en/get-started.json` and `content/pages/en/movement.json` exist as Pages docs whose `sections[]` hold all prose each page renders, plus `title`/`description`/`seo` for metadata.
2. `get-started/page.tsx` and `movement/page.tsx` resolve prose via `getPageCopy(route, locale)` + `findSection`, pass it as typed `data` props, and keep their existing record-loader calls unchanged (parallel in the same `Promise.all`). No section component calls `getTranslations`/the `t` translator for prose.
3. Metadata for both routes derives from the content Pages doc (home's `createPageMetadata` pattern), not from messages.
4. `messages.pages.getStarted` and `messages.pages.movement` are removed. All other `messages.pages.*` and `messages.common` are untouched.
5. New section schemas validate via `validate.ts`; the discriminated union gains the new section types (or reuses existing ones where they fit).
6. A site-wide scan shows **0** cross-store overlaps for get-started/movement copy; the only remaining overlaps are the accepted shared-chrome / incidental matches from §2.3.

---

## 5. Content Model

Mirror the home approach: bespoke typed sections per page, added to `pageSectionSchema`, reusing generic types (`cardGrid`, `ctaPanel`, `featuredText`, `hero`) where they fit a section's exact fields without polluting them. Each page's `sections[]` is keyed `getStarted.<section>` / `movement.<section>` (Figma-style keys, matching existing convention).

- **get-started** sections to model: hero (`heading`, `intro`), `docs` (items list), `community`, `install` labels (the structured install *data* stays in builders-hub settings; only the section's prose labels move). `build` is hidden — migrate its copy faithfully but keep it inert (home `builderPortal` precedent).
- **movement** sections to model: `hero`, `intro`, `actions`, `campaign`, `find`, `map` (zoom labels), `activism`, `events`, `involved`, `coalition`, `builder`, `resources`. Circle records (initiatives/resources/markers/events) stay in content loaders.

Exact field shapes are derived per section during planning, copied **verbatim** from the current messages values (render-invariance).

---

## 6. Component Refactor Contract

Identical discipline to home:
- Replace `getTranslations`/`t(...)` reads with typed `data` props sourced from `findSection` in the route component.
- `t('a.b')` → `data.a.b`; same field names → same output. DOM, class names, structure unchanged.
- Drop the `GetStartedTranslator` translator type and the `t` threading; sections take their section data object.
- Keep all record-data props (install steps, programs, rfps, circle markers/initiatives/events/resources) exactly as today.
- Hidden/commented sections handled faithfully (inert).

---

## 7. Regression Guard & Tests

- **Schema:** unit tests for new section schemas; `validate.ts` validates both new Pages docs.
- **Component:** `renderToStaticMarkup` + `.toContain` tests (home pattern) for refactored sections, asserting migrated copy renders.
- **Contracts:** add `get-started` and `movement` entries to `content-route-contracts.test.ts` (sections present + metadata derived from PageCopy SEO). Move the `messages.pages.movement.builder` assertion to the content equivalent.
- **Ownership guard:** extend the messages guard to assert `messages.pages` has no `getStarted` or `movement` key.
- **Byte-identical proof:** compare rendered copy vs `master` for both pages; re-run the cross-store dup scan and confirm the 16 get-started/movement overlaps are gone (remaining overlaps = accepted set).
- **Full gauntlet:** `@repo/content` validate + test, web check-types, web test, `web build` (confirm `/get-started` and `/movement` build).

---

## 8. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Large refactor surface (movement has 14 prose groups; `t` threaded deeply) | Per-section byte comparison vs master; component tests; build. Split movement into per-section steps in the plan. |
| Metadata regression when switching translated→content metadata | Contract test asserts title/description/canonical for both routes. |
| Accidentally touching record loaders / dynamic data (rfps, circle events) | Edits scoped to prose only; record-loader calls left byte-unchanged. |
| Coupled `movement.builder` contract test breaks | Migrate the assertion to the content section in the same task. |
| Hidden `get-started` Build section | Migrate copy but keep inert (home `builderPortal` precedent). |
| Deleting messages keys still referenced somewhere | Verified sole consumers are the two `page.tsx`; re-grep before deletion. |

---

## 9. Commit Plan (logical units; consolidate before PR)

1. `feat(content): add get-started & movement section schemas + Pages docs`
2. `refactor(web): source get-started copy from content; content-based metadata`
3. `refactor(web): source movement copy from content; drop pages.getStarted/movement from messages; tests + guard`

(Order keeps the app green: content first, then per-page wiring, messages deletion only after both pages no longer read them.)

---

## 10. Verification Plan

- Unit/contract: new schema tests; updated `content-route-contracts`; ownership guard.
- Build/type: `@repo/content` validate + test; web check-types; web test; `web build`.
- Manual/visual: render `/get-started` and `/movement`, confirm identical to before.
- Dedup proof: cross-store scan → get-started/movement overlaps = 0; document the remaining accepted overlaps.
