# get-started & movement Page-Copy De-duplication — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the get-started and movement pages' prose copy out of `messages.pages.*` into `@repo/content` Pages docs so no string lives in both stores, with byte-identical render.

**Architecture:** Each page's prose becomes ONE bespoke typed section (`getStartedCopy`, `movementCopy`) in a new `content/pages/en/<route>.json` Pages doc whose shape mirrors the current `messages.pages.<route>` object (minus `title`/`description`, which become PageCopy metadata fields). The route component loads it via `getPageCopy` + `findSection` (keeping its existing record-data loaders unchanged) and passes the section as a `data` prop; section components replace `t('a.b')` reads with `data.a.b`. Metadata switches from `createTranslatedPageMetadata` to the content-based `createPageMetadata`. The `messages.pages.getStarted` and `messages.pages.movement` keys are deleted.

**Tech Stack:** Next.js App Router (`[locale]`), next-intl (being removed from these two pages' prose), Zod, `@repo/content` (loaders + schemas), Vitest + `renderToStaticMarkup` (web), `node:test` (content package).

## Global Constraints

- **Render output unchanged (byte-identical).** Only the data SOURCE changes: `t('a.b')` → `data.a.b`. DOM, class names, structure, hrefs unchanged. Verified vs `master`.
- **Cross-store-only dedup.** Goal: no string in BOTH messages and content. content↔content reuse is fine (get-started copy may equal builders-hub copy; movement may equal circles copy — acceptable).
- **Verbatim copy.** Section payloads are byte-identical to the current `messages.pages.<route>` values (curly apostrophes, em/en dashes, `\n`, etc. preserved).
- **Metadata parity.** Content `title`/`description` = the exact current `messages.pages.<route>.title`/`description` (e.g. `"Get Started | Logos"`); no `seo.metaTitle`/`metaDescription` override, so `createPageMetadata`'s fallbacks reproduce identical metadata.
- **Do not touch record/dynamic data.** `getBuilderHubSettings`/`resolveBuilderHubHomeRfps` and `getCirclesSettings`/`getCircleInitiatives`/`getCircleResources`/`getActiveCircleMarkers`/`getUpcomingCircleEvents` calls stay byte-unchanged.
- **Out of scope:** all other `messages.pages.*`, `messages.common`, and accepted shared labels/URLs + incidental matches (see spec §2.3).
- **Commits:** few logical commits (content; get-started; movement+cleanup); consolidate before PR. No `Co-Authored-By: Claude`.

---

## File Structure

**Create:**
- `content/pages/en/get-started.json` — PageCopy doc, one `getStartedCopy` section.
- `content/pages/en/movement.json` — PageCopy doc, one `movementCopy` section.
- `packages/content/src/schemas/__tests__/page-dedup-sections.test.ts` — schema tests (node:test).
- Component tests under `apps/web/app/[locale]/get-started/_sections/__tests__/` and `apps/web/components/sections/movement/__tests__/` as needed.

**Modify:**
- `packages/content/src/schemas/pages.ts` — add `getStartedCopySection`, `movementCopySection` to the union.
- `apps/web/app/[locale]/get-started/page.tsx` + `_sections/*` — content props, drop `t`.
- `apps/web/app/[locale]/movement/page.tsx` + `apps/web/components/sections/movement/*` — content props, drop `t`.
- `apps/web/messages/en.json` — delete `pages.getStarted`, `pages.movement`.
- `apps/web/lib/__tests__/content-route-contracts.test.ts` — add get-started/movement contracts; move the `movement.builder` assertion to content.
- `apps/web/lib/__tests__/messages-no-home-copy.test.ts` (or a sibling) — extend ownership guard.

---

## Task 1: Add `getStartedCopy` and `movementCopy` section schemas

**Files:**
- Modify: `packages/content/src/schemas/pages.ts`
- Test: `packages/content/src/schemas/__tests__/page-dedup-sections.test.ts`

**Interfaces:**
- Produces: `GetStartedCopySection` (`componentType: 'getStartedCopy'`), `MovementCopySection` (`componentType: 'movementCopy'`), both added to `pageSectionSchema`.

**Approach:** model each section's payload to mirror the current `messages.pages.<route>` object MINUS `title`/`description` (kept `heading` at top). Use explicit nested `z.object`s matching the key trees in spec §3.

- [ ] **Step 1: Write the failing test**

Create `packages/content/src/schemas/__tests__/page-dedup-sections.test.ts` (match the package's existing `node:test`/`node:assert/strict` convention used in `home-sections.test.ts`):

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { getStartedCopySectionSchema, movementCopySectionSchema, pageSectionSchema } from '../pages'

test('getStartedCopy parses a minimal valid value and routes through the union', () => {
  const value = {
    componentType: 'getStartedCopy',
    key: 'getStarted.copy',
    heading: 'Get Started',
    intro: 'x',
    sections: {
      install: { number: '01', heading: 'h', cardTitle: 'c', body: 'b', cta: 'i', imageAlt: 'a' },
      docs: { number: '02', heading: 'h', items: { docs: { title: 't', body: 'b' } }, viewDocsCta: 'v', learnMoreCta: 'l', atomicSwapsCta: 'a', multisigCta: 'm' },
      community: { number: '04', heading: 'h', cta: 'c', items: { forum: 'f' } },
      build: { number: '04', heading: 'h', cta: 'c', nodeCta: 'n', messagingCta: 'm', deployCta: 'd', tryItOutCta: 't', scaffoldCta: 's', items: { node: { title: 't', body: 'b' } } },
    },
  }
  assert.equal(getStartedCopySectionSchema.parse(value).componentType, 'getStartedCopy')
  assert.equal(pageSectionSchema.parse(value).componentType, 'getStartedCopy')
})

test('movementCopy parses a minimal valid value and routes through the union', () => {
  const value = {
    componentType: 'movementCopy',
    key: 'movement.copy',
    heading: 'Movement',
    hero: { title: 't', kicker: 'k', body: 'b', primaryCta: 'p', secondaryCta: 's' },
    intro: { titleLine1: 'a', titleLine2: 'b', body: 'c' },
    actions: { activism: { title: 't', body: 'b', cta: 'c' }, coalition: { title: 't', body: 'b', cta: 'c' }, building: { title: 't', body: 'b', cta: 'c' } },
    campaign: { eyebrow: 'e', kicker: 'k', title: 't', body: 'b', primaryCta: 'p', secondaryCta: 's', tertiaryCta: 't' },
    find: { title: 't', body: 'b', cta: 'c' },
    map: { zoomIn: 'i', zoomOut: 'o' },
    activismSection: { title: 't', body: 'b', cta: 'c', cardBody: 'cb', cards: { losAngeles: { city: 'c', title: 't' }, london: { city: 'c', title: 't' }, porto: { city: 'c', title: 't' } } },
    events: { title: 't', body: 'b', cta: 'c', day1: { date: 'd', weekday: 'w' }, day2: { date: 'd', weekday: 'w' }, day3: { date: 'd', weekday: 'w' }, card: { title: 't', time: 't', timezone: 'z', location: 'l', hosts: 'h' } },
    involved: { title: 't', body: 'b', primaryCta: 'p', secondaryCta: 's' },
    coalition: { title: 't', body: 'b', cta: 'c' },
    builder: { title: 't', body: 'b', primaryCta: 'p', secondaryCta: 's', feature: { city: 'c', title: 't', cta: 'c' }, details: { problem: { label: 'l', body: 'b' }, solution: { label: 'l', body: 'b' }, stack: { label: 'l', body: 'b' } } },
    resources: { titleLine1: 'a', titleLine2: 'b', body: 'c', cta: 'd', rows: { start: { number: '01', title: 't', body: 'b', cta: 'c' } } },
  }
  assert.equal(movementCopySectionSchema.parse(value).componentType, 'movementCopy')
  assert.equal(pageSectionSchema.parse(value).componentType, 'movementCopy')
})
```

> NOTE on the `activism` field: `messages.pages.movement` has BOTH a top-level `activism` group AND `actions.activism`. To avoid a key clash in the typed section, name the top-level activism-section field `activismSection` in the schema/content, and the movement components read `data.activismSection.*` where they previously read `t('activism.*')`. (This is the ONE rename; document it in the component task.) `actions.activism` stays nested under `actions`.

- [ ] **Step 2: Run → fail**

Run: `pnpm --filter @repo/content test page-dedup-sections`
Expected: FAIL (exports missing).

- [ ] **Step 3: Add the schemas to `pages.ts`**

Insert before `customSectionSchema`, after the home sections:

```ts
// ---------------------------------------------------------------------------
// Page-copy sections for get-started and movement (one blob section per page;
// shape mirrors the former messages.pages.<route> tree minus title/description)
// ---------------------------------------------------------------------------

const gsItemSchema = z.object({ title: z.string().min(1), body: z.string().min(1).optional() })

export const getStartedCopySectionSchema = z.object({
  componentType: z.literal('getStartedCopy'),
  key: sectionKeySchema,
  heading: z.string().min(1),
  intro: z.string().min(1),
  sections: z.object({
    install: z.object({
      number: z.string().min(1), heading: z.string().min(1), cardTitle: z.string().min(1),
      body: z.string().min(1), cta: z.string().min(1), imageAlt: z.string().min(1),
    }),
    docs: z.object({
      number: z.string().min(1), heading: z.string().min(1),
      items: z.record(gsItemSchema),
      viewDocsCta: z.string().min(1), learnMoreCta: z.string().min(1),
      atomicSwapsCta: z.string().min(1), multisigCta: z.string().min(1),
    }),
    community: z.object({
      number: z.string().min(1), heading: z.string().min(1), cta: z.string().min(1),
      items: z.record(z.string().min(1)),
    }),
    build: z.object({
      number: z.string().min(1), heading: z.string().min(1), cta: z.string().min(1),
      nodeCta: z.string().min(1), messagingCta: z.string().min(1), deployCta: z.string().min(1),
      tryItOutCta: z.string().min(1), scaffoldCta: z.string().min(1),
      items: z.record(gsItemSchema),
    }),
  }),
})
export type GetStartedCopySection = z.infer<typeof getStartedCopySectionSchema>

const mvCtaGroup = z.object({ title: z.string().min(1), body: z.string().min(1), cta: z.string().min(1) })

export const movementCopySectionSchema = z.object({
  componentType: z.literal('movementCopy'),
  key: sectionKeySchema,
  heading: z.string().min(1),
  hero: z.object({ title: z.string().min(1), kicker: z.string().min(1), body: z.string().min(1), primaryCta: z.string().min(1), secondaryCta: z.string().min(1) }),
  intro: z.object({ titleLine1: z.string().min(1), titleLine2: z.string().min(1), body: z.string().min(1) }),
  actions: z.object({ activism: mvCtaGroup, coalition: mvCtaGroup, building: mvCtaGroup }),
  campaign: z.object({ eyebrow: z.string().min(1), kicker: z.string().min(1), title: z.string().min(1), body: z.string().min(1), primaryCta: z.string().min(1), secondaryCta: z.string().min(1), tertiaryCta: z.string().min(1) }),
  find: z.object({ title: z.string().min(1), body: z.string().min(1), cta: z.string().min(1) }),
  map: z.object({ zoomIn: z.string().min(1), zoomOut: z.string().min(1) }),
  activismSection: z.object({
    title: z.string().min(1), body: z.string().min(1), cta: z.string().min(1), cardBody: z.string().min(1),
    cards: z.record(z.object({ city: z.string().min(1), title: z.string().min(1) })),
  }),
  events: z.object({
    title: z.string().min(1), body: z.string().min(1), cta: z.string().min(1),
    day1: z.object({ date: z.string().min(1), weekday: z.string().min(1) }),
    day2: z.object({ date: z.string().min(1), weekday: z.string().min(1) }),
    day3: z.object({ date: z.string().min(1), weekday: z.string().min(1) }),
    card: z.object({ title: z.string().min(1), time: z.string().min(1), timezone: z.string().min(1), location: z.string().min(1), hosts: z.string().min(1) }),
  }),
  involved: z.object({ title: z.string().min(1), body: z.string().min(1), primaryCta: z.string().min(1), secondaryCta: z.string().min(1) }),
  coalition: z.object({ title: z.string().min(1), body: z.string().min(1), cta: z.string().min(1) }),
  builder: z.object({
    title: z.string().min(1), body: z.string().min(1), primaryCta: z.string().min(1), secondaryCta: z.string().min(1),
    feature: z.object({ city: z.string().min(1), title: z.string().min(1), cta: z.string().min(1) }),
    details: z.object({
      problem: z.object({ label: z.string().min(1), body: z.string().min(1) }),
      solution: z.object({ label: z.string().min(1), body: z.string().min(1) }),
      stack: z.object({ label: z.string().min(1), body: z.string().min(1) }),
    }),
  }),
  resources: z.object({
    titleLine1: z.string().min(1), titleLine2: z.string().min(1), body: z.string().min(1), cta: z.string().min(1),
    rows: z.record(z.object({ number: z.string().min(1), title: z.string().min(1), body: z.string().min(1), cta: z.string().min(1) })),
  }),
})
export type MovementCopySection = z.infer<typeof movementCopySectionSchema>
```

Add both to the `pageSectionSchema` discriminated union (alongside the home sections, before `customSectionSchema`).

- [ ] **Step 4: Run → pass**

Run: `pnpm --filter @repo/content test page-dedup-sections`
Expected: PASS.

- [ ] **Step 5: Typecheck + commit**

Run: `pnpm --filter @repo/content check-types`
```bash
git add packages/content/src/schemas/pages.ts packages/content/src/schemas/__tests__/page-dedup-sections.test.ts
git commit -m "feat(content): add getStartedCopy & movementCopy page section schemas"
```

---

## Task 2: Create `content/pages/en/get-started.json`

**Files:**
- Create: `content/pages/en/get-started.json`

**Interfaces:** Consumes `getStartedCopySectionSchema`. Produces a `getStartedCopy` section at key `getStarted.copy`.

- [ ] **Step 1: Write the content file**

Create `content/pages/en/get-started.json`. Use `ROUTES.getStarted` value (`/get-started`) for `route`. Set `title`/`description` to the EXACT current `messages.pages.getStarted.title`/`description`. The single section's fields are the current `messages.pages.getStarted` object with `title`/`description` removed (i.e. `heading`, `intro`, `sections.*`), copied VERBATIM. Read the live values from `apps/web/messages/en.json` → `pages.getStarted` and paste exactly.

```jsonc
{
  "schemaVersion": 1,
  "language": "en",
  "route": "/get-started",
  "title": "Get Started | Logos",
  "description": "Install Basecamp, read the Logos docs, join the community, and start building with the Logos testnet.",
  "sections": [
    {
      "componentType": "getStartedCopy",
      "key": "getStarted.copy",
      "heading": "Get Started",
      "intro": "<verbatim messages.pages.getStarted.intro>",
      "sections": {
        "install": { "...": "verbatim messages.pages.getStarted.sections.install" },
        "docs": { "...": "verbatim messages.pages.getStarted.sections.docs" },
        "community": { "...": "verbatim messages.pages.getStarted.sections.community" },
        "build": { "...": "verbatim messages.pages.getStarted.sections.build" }
      }
    }
  ]
}
```

> Replace each `<verbatim …>` / `"...": "verbatim …"` placeholder with the exact object from messages. After editing there must be no `verbatim` text left in the file.

- [ ] **Step 2: Validate + no-placeholder check**

Run: `pnpm --filter @repo/content validate`
Expected: PASS.
```bash
! grep -q "verbatim" content/pages/en/get-started.json && echo "OK: no placeholders"
```

- [ ] **Step 3: Commit**

```bash
git add content/pages/en/get-started.json
git commit -m "feat(content): add get-started page copy doc"
```

---

## Task 3: Refactor get-started to read copy from content

**Files:**
- Modify: `apps/web/app/[locale]/get-started/page.tsx`
- Modify: `apps/web/app/[locale]/get-started/_sections/{get-started-page,hero,install,docs,community,build,types}.tsx`
- Test: `apps/web/app/[locale]/get-started/_sections/__tests__/get-started-copy.test.tsx`

**Interfaces:** Consumes `GetStartedCopySection`. The route loads it via `findSection<GetStartedCopySection>(page.sections, 'getStartedCopy', 'getStarted.copy')`.

- [ ] **Step 1: Write the failing test**

Create a `renderToStaticMarkup` test (mirror `apps/web/components/sections/home/__tests__/decide-section.test.tsx`) that renders `GetStartedPage` (or the smallest section that takes `data`) with a fixture `getStartedCopy` section and asserts a migrated string (e.g. the docs heading "Start Building" and `intro`) renders. Stub heavy imports.

- [ ] **Step 2: Run → fail.**

Run: `pnpm --filter web test get-started-copy`
Expected: FAIL.

- [ ] **Step 3: Refactor**

In `page.tsx`: add `getPageCopy(ROUTES.getStarted, locale)` to the `Promise.all`, drop `getTranslations`/`NAMESPACE`, `findSection<GetStartedCopySection>(...)`, pass `data={section}` to `<GetStartedPage>` alongside the existing `basecampInstall`/`developerPrograms`/`rfps` props. Switch `generateMetadata` to `createPageMetadata(ROUTES.getStarted)`.

In `_sections/get-started-page.tsx` and children: replace the `t: GetStartedTranslator` prop with `data: GetStartedCopySection` and pass slices down — `<Hero heading={data.heading} intro={data.intro} />`, `<Install labels={data.sections.install} data={basecampInstall} />`, `<Docs data={data.sections.docs} />`, `<Community data={data.sections.community} />`. Inside each, replace `t('sections.docs.items.x.title')` → `data.items.x.title` (where `data` = the docs slice), `t('heading')` → `data.heading`, etc. Remove `GetStartedTranslator` from `types.ts` if now unused. Keep the hidden `Build` handling faithful (migrate copy, stays commented). Keep `Programs`/record-data props unchanged.

> Read each current `_sections/*.tsx` to map its exact `t('…')` calls to the corresponding `data.…` path. DOM/classes unchanged.

- [ ] **Step 4: Run → pass + typecheck**

Run: `pnpm --filter web test get-started-copy`
Run: `pnpm --filter web check-types`
Expected: PASS / clean.

> The contract test and full suite are not green until Task 6 deletes messages + updates contracts. Run focused tests + check-types here.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/[locale]/get-started
git commit -m "refactor(web): source get-started copy from content; content-based metadata"
```

---

## Task 4: Create `content/pages/en/movement.json`

**Files:**
- Create: `content/pages/en/movement.json`

**Interfaces:** Consumes `movementCopySectionSchema`. Produces a `movementCopy` section at key `movement.copy`.

- [ ] **Step 1: Write the content file**

Create `content/pages/en/movement.json`. `route` = `/movement` (`ROUTES.movement`). `title`/`description` = exact `messages.pages.movement.title`/`description`. The single `movementCopy` section's fields = the current `messages.pages.movement` object with `title`/`description` removed and the top-level `activism` group RENAMED to `activismSection` (per Task 1 note); everything else verbatim.

```jsonc
{
  "schemaVersion": 1,
  "language": "en",
  "route": "/movement",
  "title": "Movement | Logos",
  "description": "Ways to contribute to the Logos movement.",
  "sections": [
    {
      "componentType": "movementCopy",
      "key": "movement.copy",
      "heading": "Movement",
      "hero": { "...": "verbatim messages.pages.movement.hero" },
      "intro": { "...": "verbatim messages.pages.movement.intro" },
      "actions": { "...": "verbatim messages.pages.movement.actions" },
      "campaign": { "...": "verbatim messages.pages.movement.campaign" },
      "find": { "...": "verbatim messages.pages.movement.find" },
      "map": { "...": "verbatim messages.pages.movement.map" },
      "activismSection": { "...": "verbatim messages.pages.movement.activism (top-level activism group)" },
      "events": { "...": "verbatim messages.pages.movement.events" },
      "involved": { "...": "verbatim messages.pages.movement.involved" },
      "coalition": { "...": "verbatim messages.pages.movement.coalition" },
      "builder": { "...": "verbatim messages.pages.movement.builder" },
      "resources": { "...": "verbatim messages.pages.movement.resources" }
    }
  ]
}
```

> Replace placeholders with exact objects from `messages.pages.movement`. No `verbatim` text may remain.

- [ ] **Step 2: Validate + no-placeholder check**

Run: `pnpm --filter @repo/content validate`
```bash
! grep -q "verbatim" content/pages/en/movement.json && echo "OK: no placeholders"
```

- [ ] **Step 3: Commit**

```bash
git add content/pages/en/movement.json
git commit -m "feat(content): add movement page copy doc"
```

---

## Task 5: Refactor movement to read copy from content

**Files:**
- Modify: `apps/web/app/[locale]/movement/page.tsx`
- Modify: `apps/web/components/sections/movement/*` (movement-page + sub-sections that consume `t`)
- Test: `apps/web/components/sections/movement/__tests__/movement-copy.test.tsx`

**Interfaces:** Consumes `MovementCopySection` via `findSection<MovementCopySection>(page.sections, 'movementCopy', 'movement.copy')`.

- [ ] **Step 1: Write the failing test**

`renderToStaticMarkup` test rendering `MovementPageView` (or its sub-sections) with a fixture `movementCopy` section + minimal stubs for the circle record props (markers/initiatives/events/resources can be empty arrays/objects), asserting migrated strings render (e.g. hero `body`, `campaign.title`, `builder.title`). Stub heavy imports (map, motion, next/image).

- [ ] **Step 2: Run → fail.** `pnpm --filter web test movement-copy` → FAIL.

- [ ] **Step 3: Refactor**

In `page.tsx`: add `getPageCopy(ROUTES.movement, locale)` to the `Promise.all`, drop `getTranslations`/`NAMESPACE`, `findSection<MovementCopySection>(...)`, pass `data={section}` to `<MovementPageView>` alongside existing circle props. Switch `generateMetadata` to `createPageMetadata(ROUTES.movement)`.

In `components/sections/movement/*`: replace the `t` prop/threading with `data: MovementCopySection` (or per-sub-section slices), replacing every `t('group.field')` with `data.group.field`. The one rename: `t('activism.*')` (top-level activism section) → `data.activismSection.*`; `t('actions.activism.*')` stays `data.actions.activism.*`. Keep all circle record props (markers/initiatives/resources/events) unchanged. DOM/classes unchanged.

> Read each movement component to map exact `t('…')` calls to `data.…`. This is the largest surface — proceed section group by section group, verifying each.

- [ ] **Step 4: Run → pass + typecheck.** `pnpm --filter web test movement-copy`; `pnpm --filter web check-types` → clean.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/[locale]/movement apps/web/components/sections/movement
git commit -m "refactor(web): source movement copy from content; content-based metadata"
```

---

## Task 6: Delete messages keys, update tests, verify dedup

**Files:**
- Modify: `apps/web/messages/en.json` (delete `pages.getStarted`, `pages.movement`)
- Modify: `apps/web/lib/__tests__/content-route-contracts.test.ts`
- Modify: `apps/web/lib/__tests__/messages-no-home-copy.test.ts`

- [ ] **Step 1: Update contracts + move the movement.builder assertion**

In `content-route-contracts.test.ts`: add `get-started` and `movement` to the `contracts` array (route + name + sections `[{componentType:'getStartedCopy', key:'getStarted.copy'}]` / `[{componentType:'movementCopy', key:'movement.copy'}]`). The existing assertion reading `messages.pages.movement.builder` (Benin fundraising feature/details) must be rewritten to read the same data from `getPageCopy('/movement','en')` → `findSection('movementCopy','movement.copy')` → `.builder` (so it asserts the content, not messages).

- [ ] **Step 2: Extend the ownership guard**

In `messages-no-home-copy.test.ts` add:
```ts
it('contains no get-started or movement page copy in messages.pages', () => {
  const pages = (messages as { pages: Record<string, unknown> }).pages
  expect(Object.keys(pages)).not.toContain('getStarted')
  expect(Object.keys(pages)).not.toContain('movement')
})
```

- [ ] **Step 3: Delete the messages keys**

Remove `pages.getStarted` and `pages.movement` from `apps/web/messages/en.json`. Leave all other `pages.*`, `common`, `connectForm`, `designSystems`, `locale` intact. Grep to confirm no remaining reader: `grep -rn "pages.getStarted\|pages.movement" apps/web --include=*.ts --include=*.tsx | grep -v __tests__` → none.

- [ ] **Step 4: Full verification**

Run: `pnpm --filter @repo/content validate` (both new docs validate)
Run: `pnpm --filter @repo/content test`
Run: `pnpm --filter web check-types`
Run: `pnpm --filter web test` (full suite green)
Run: `pnpm --filter web build` (confirm `/get-started`, `/movement` build)
Cross-store dedup proof — re-run the messages-vs-content substantial-overlap scan and confirm the get-started (9) + movement (7) strings no longer appear in `messages`; remaining overlaps = the accepted shared-chrome/incidental set only.

- [ ] **Step 5: Manual visual check**

Open `/get-started` and `/movement`; confirm identical to before.

- [ ] **Step 6: Commit**

```bash
git add apps/web/messages/en.json apps/web/lib/__tests__/content-route-contracts.test.ts apps/web/lib/__tests__/messages-no-home-copy.test.ts
git commit -m "chore(web): drop pages.getStarted/movement from messages; guard + contracts via content"
```

---

## Self-Review

**Spec coverage:** §2 decisions → Tasks 2/4 (content, verbatim, metadata parity), Task 6 (delete keys, dedup proof). §4 target state → Tasks 1–6. §5 content model → Tasks 1/2/4 (one bespoke section per page). §6 refactor contract → Tasks 3/5. §7 tests → Tasks 1/3/5/6. §8 risks → metadata parity (Task 3/5 + contract assertions), record-loader untouched (constraints), movement.builder move (Task 6), hidden Build (Task 3). §9 commit plan → task commits (consolidate at PR).

**Placeholder scan:** the only deferred content is the `<verbatim …>` markers in Tasks 2/4 (data move, with grep guards). All schema/test code is concrete.

**Type consistency:** `getStartedCopy`/`movementCopy` literals and `GetStartedCopySection`/`MovementCopySection` types used identically in Tasks 1 (def), 2/4 (content keys `getStarted.copy`/`movement.copy`), 3/5 (findSection), 6 (contracts/guard). The `activism`→`activismSection` rename is defined in Task 1 and applied in Tasks 4 (content) and 5 (component) consistently.

> **Pre-flight for implementers:** Tasks 3 and 5 require reading each current component to map `t('…')` calls to `data.…` paths exactly; preserve DOM/classes/hrefs and all record-data props. The movement refactor is large — verify section group by section group against `master`.
