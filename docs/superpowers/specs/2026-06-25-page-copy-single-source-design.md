# Page Copy Single Source — Design Spec (Workstream A)

- **Date:** 2026-06-25
- **Branch:** `refactor/page-copy-single-source`
- **Status:** Approved (decisions locked — see §10)
- **Scope:** Home page copy de-duplication + `messages/en.json` cleanup. Tech-stack
  detail pages and Basecamp are explicitly **out of scope** (they are already
  single-source in `content`).

---

## 1. Problem

`apps/web` stores i18n copy in **two** places with overlapping responsibility:

1. **next-intl messages** — `apps/web/messages/<locale>.json` (today: `en.json` only).
2. **`@repo/content`** — `content/pages/<locale>/*.json` (Pages), plus record and
   site directories.

The home page is the one place where the same copy lives in **both** stores, which
creates drift risk and ambiguity about "where do I edit this string?". This
workstream removes that duplication for the home page and establishes a clear
ownership contract so future copy has exactly one home.

---

## 2. Ownership Contract (the rule going forward)

Copy lives in exactly one store, chosen by its nature:

| Copy kind | Owner | Location | Identified by |
|---|---|---|---|
| Landing-page copy (structure + prose, per section) | `@repo/content` Pages | `content/pages/<locale>/<route>.json` → `sections[]` | `componentType` + `key` |
| Records (circle / rfp / idea / event) | `@repo/content` record dirs | `content/<collection>/<id>/index.json` (non-translated data) + `<locale>.json` (copy) | per-collection |
| Shared UI chrome (nav, footer, forms, language switcher, shared component labels) | next-intl messages | `apps/web/messages/<locale>.json` | namespace key |

**Direction = Y (content/pages-centric).** Messages keeps only chrome. Rationale:
tech-stack (×5) + Basecamp (~40 sections) are already single-source in `content`
with zero duplication; the only duplication is on home. Y is ~6× less work than
porting everything into messages, and a section/block editor is friendlier for
marketing than a flat message catalog.

**Locale axis is orthogonal.** Both stores already use one-file-per-locale. Adding
a language = one line in `routing.ts` + parallel `<locale>` files. No structural
change. (Locale wiring itself — Workstream C — is dropped as YAGNI; today only
`en` is active and the admin dashboard is English-only. B and D must keep `locale`
behind a single constant/seam, not scatter it.)

---

## 3. Current State — Verified Inventory (2026-06-25)

### 3.1 Home render reality

`apps/web/app/[locale]/page.tsx` (108 lines) renders **exactly 10 sections** and
consumes **only 3 content sections** via `findSection` (`createSectionFinder('home')`):

| # | Rendered component | Data source today |
|---|---|---|
| 1 | `HeroSectionView` | **content** `findSection('hero','home.atf')` |
| 2 | `SocialProofSection` | **messages** `home.socialProof` (+ dynamic `getSocialProofStats`, `getWinnableIssuesCount` props) |
| 3 | `FeatureCardsSection` | **messages** `home.paths` |
| 4 | `AboutSection` | **messages** `home.about` |
| 5 | `DecideSection` | **messages** `home.decide` |
| 6 | `UseCasesSection` | **messages** `home.useCases` |
| 7 | `BuilderPortalSection` | **messages** `home.builderPortal` |
| 8 | `TechStackSection` | **content** `findSection('techStackOverview','home.techStack')` for structure **+ messages** `home.techStack` `t('exploreStackCta'/'startBuildingCta'/'docsCta')` for the 3 CTA labels (passed as `ctas` prop) |
| 9 | `StartBuildingSection` | **messages** `home.startBuilding` |
| 10 | `BlogSection` | **content** `findSection('relatedArticles','home.blog')` (+ `getLatestBlogArticles`) |

7 components self-fetch from next-intl: `about`, `builder-portal`, `decide`,
`start-building`, `feature-cards`, `use-cases`, `social-proof`. These are the
refactor targets.

### 3.2 `messages.home` keys (11) — classification

| key | Rendered? | Content twin? | Action |
|---|---|---|---|
| `socialProof` | ✅ (static labels) | none | **Migrate** to a new content section; refactor component to props. Dynamic stats stay in `getSocialProofStats`. |
| `decide` | ✅ | none | **Migrate** + refactor. |
| `paths` | ✅ (FeatureCardsSection) | none | **Migrate** + refactor. |
| `startBuilding` | ✅ | none | **Migrate** + refactor. |
| `about` | ✅ | `home.about` (`richText`, orphaned) | **Reconcile + migrate** (see §3.3) + refactor. |
| `useCases` | ✅ | `home.useCases` (`cardGrid`, orphaned) | **Reconcile + migrate** + refactor. |
| `builderPortal` | ✅ | `home.builderPortal` (`ctaPanel`, orphaned) | **Reconcile + migrate** + refactor. |
| `techStack` | ✅ (CTA labels only) | `home.techStack` (`techStackOverview`, rendered for structure) | **Merge** 3 CTA labels into the content section; drop messages key. |
| `build` | ❌ no consumer | copy already in content `home.triptych` | **Delete** (dead). |
| `node` | ❌ no consumer | copy already in content `home.triptych` | **Delete** (dead). |
| `circles` | ❌ no consumer | copy already in content `home.triptych` | **Delete** (dead). |

> **Correction vs. brainstorm:** the brainstorm listed `build`/`node`/`circles`
> as "messages-only → migrate to content." Verification shows their copy already
> exists in content `home.triptych` (cardGrid: Build / Node Programme / Circles)
> and **no component consumes the messages keys**. They are dead → **delete, not
> migrate.** Net messages-only-to-migrate is **4** (socialProof, decide, paths,
> startBuilding), not 7.

### 3.3 The "duplicates" are divergent representations (drift risk)

The content twins of `about`/`useCases`/`builderPortal` are **not** clean copies of
what renders — they are a *different shape* and are **not currently rendered**:

- `messages.home.about` = structured `{ quote, headline, body, ... }` (what
  `AboutSection` reads via `t('quote')` etc.).
- `content` `home.about` = `componentType: 'richText'` with a single `body` blob
  that reads like quote+headline+body concatenated into prose.

So "merge duplicate into content" is **not** a delete-one-side operation. For each
of the three, we must (a) decide the canonical content schema shape, (b) port the
**live** copy (the rendered messages version is the source of truth) into content
in that shape, (c) refactor the component to read content props via `findSection`
in `page.tsx`, (d) delete the messages key. **Decision (locked):** the **current
rendered website output is the single source of truth.** For
`about`/`useCases`/`builderPortal` that is the live messages copy, which
**overwrites** the orphaned content twin verbatim. No case-by-case review — content
is unified to match what the site renders today.

### 3.4 Orphaned / unrendered content sections (flag, not in scope)

`content/pages/en/home.json` has 11 sections; only `home.atf`, `home.techStack`,
`home.blog` are consumed. These exist but are **not rendered** by `page.tsx`:
`triptych`, `parallelSocietyHeadline`, `parallelSociety`, `mountain`,
`circlesCta`. Their components (`parallel-society-section`, `mountain-section`,
`circles-cta-section`, `civil-society-accordion`) are not imported anywhere in
`apps/web/app`.

This is **out of scope** for Workstream A (which only removes *duplication*), but
flagged: deleting messages `build`/`node`/`circles` is safe regardless (nothing
consumes them), and the triptych copy survives in content. Whether the unrendered
content sections should render is a separate product question — do **not** resolve
it here.

### 3.5 Other messages namespaces (must survive)

- `messages.common` = `{ docsNav, nav }` → chrome, **keep**.
- `messages.pages` = per-page metadata/labels for **other** routes (`getStarted`,
  `technologyStack`, `about`, `faq`, …). Note `pages.about` ≠ `home.about`. This is
  **not** home copy; out of scope, and must be on the regression-guard allowlist.
- `messages.connectForm`, `messages.designSystems`, `messages.locale` → out of
  scope; verify untouched.

---

## 4. Target State

After Workstream A:

1. `content/pages/en/home.json` `sections[]` contains a section for **every**
   piece of home copy that the page renders: existing (`atf`, `techStack`, `blog`)
   plus reconciled/migrated (`about`, `useCases`, `builderPortal`, `socialProof`,
   `decide`, `paths`, `startBuilding`). techStack section also carries its 3 CTA
   labels.
2. `apps/web/app/[locale]/page.tsx` resolves all home copy via `findSection` and
   passes it as props. No home section component calls `useTranslations` /
   `getTranslations` for page copy. Dynamic data (`getSocialProofStats`,
   `getWinnableIssuesCount`, `getLatestBlogArticles`) stays as-is.
3. `messages/en.json` has **no** `home.*` page-content keys. `common`, `pages`,
   `connectForm`, `designSystems`, `locale` are unchanged.
4. A regression-guard test asserts `messages/en.json` has no `home` namespace
   (with an explicit allowlist for any intentionally-shared keys, if any emerge).
5. New/updated content section schemas in `packages/content/src/schemas/` validate
   via the existing `packages/content/scripts/validate.ts`.

---

## 5. Component Refactor Contract

Each of the 7 components moves from self-fetching messages to receiving typed
content props:

- **Before:** `const t = await getTranslations({ locale, namespace: 'home.X' })`.
- **After:** component takes `data: <XSection>` (typed from `@repo/content/schemas`);
  `page.tsx` does `const x = findSection<XSection>(page.sections, '<componentType>', 'home.X')`
  and renders `<XSection data={x} />`.
- `social-proof-section`: only the **static labels** move to content; the
  `stats` / `winnableIssuesCount` props (dynamic) are unchanged.
- `tech-stack-section`: already takes a `ctas` prop with a `data.cta` fallback;
  move the 3 labels into the content `techStack` section (e.g. a `ctas[]` field)
  and have `page.tsx` read them from content instead of `t(...)`.

Keep changes immutable and minimal-diff; match existing section component patterns
(`hero-section`, `blog-section`, `tech-stack-section` already take `data` props).

---

## 6. Regression Guard

- **Test:** assert `messages/en.json` (parsed) has no `home` key — i.e.
  `expect(Object.keys(messages)).not.toContain('home')`, or assert the home
  page-content namespaces are gone with an explicit `ALLOWLIST` constant for any
  key intentionally kept shared. Default: no allowlist entries needed (home copy
  is fully owned by content).
- Extend the existing contract test family
  (`apps/web/lib/__tests__/content-route-contracts.test.ts`) or add a sibling test
  so CI fails if home copy reappears in messages.
- Run `packages/content` validation (`scripts/validate.ts`) to confirm new content
  sections satisfy their schemas.

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| **Copy drift** between orphaned content twin and live messages for about/useCases/builderPortal | **Rendered website output is the source of truth** (= the live messages copy). Overwrite the content twin to match; no case-by-case review (locked decision). |
| Refactoring 7 components could change rendered markup/spacing | Snapshot/visual check each section before & after; keep DOM and class names identical, change only the data source. |
| Schema additions break `@repo/content` build/validation | Add schema fields first, run `validate.ts` + typecheck before wiring `page.tsx`. |
| Accidentally deleting non-home messages (`pages`, `common`, etc.) | Surgical key deletion only under `home`; regression guard allowlists `pages`/`common`; diff-review every messages edit. |
| Unrendered content sections create confusion mid-refactor | Explicitly out of scope; documented in §3.4; no edits to those sections in A. |
| Locale hardcoding creep | `en` stays the single active locale; do not add locale plumbing (Workstream C dropped). |

---

## 8. Commit Plan (logical units; commits allowed mid-stream, PR needs pre-approval)

1. `docs: add page-copy single-source design spec` (this file).
2. `feat(content): add home section schemas for socialProof/decide/paths/startBuilding/about/useCases/builderPortal + techStack ctas`.
3. `feat(content): populate content/pages/en/home.json with migrated/reconciled home copy`.
4. `refactor(web): feed home sections from content props` — `page.tsx` + the 7
   components (may split per-section if diffs are large).
5. `chore(messages): remove home page-content namespace from en.json` (incl. dead
   build/node/circles).
6. `test(web): regression guard — no home copy in messages`.

(Order keeps the app green at each step: schemas + content first, component wiring
next, messages deletion only after components no longer read them, guard last.)

---

## 9. Test Plan

- **Unit/contract:** regression guard (§6); `content` schema validation for new
  sections.
- **Component:** existing `apps/web/components/sections/home/__tests__` updated to
  drive components via `data` props; assert rendered text matches migrated copy.
- **Build/type:** typecheck across `apps/web` + `packages/content`.
- **Manual/visual:** render home for `en`, confirm all 10 sections look identical
  pre/post (hero, social proof, feature cards, about, decide, use cases, builder
  portal, tech stack + CTAs, start building, blog).
- **Coverage:** new/changed code meets the repo's existing test bar.

---

## 10. Decisions (locked 2026-06-25)

1. **Drift reconciliation:** the **current rendered website output is the absolute
   source of truth.** For `about`/`useCases`/`builderPortal` that is the live
   messages copy; content is unified to match it verbatim. No case-by-case review.
2. **Content schema shape** for the 4 net-new sections (`socialProof`, `decide`,
   `paths`, `startBuilding`): **reuse existing `componentType`s** (e.g. `cardGrid`,
   `ctaPanel`, `richText`) where they fit; add fields only where a component needs
   them. Introduce a new type only if no existing one fits.
3. **Unrendered content sections** (triptych, parallelSociety, mountain,
   circlesCta): **left entirely untouched** in Workstream A. No edits, no deletion.
4. **Regression guard strictness:** assert **no `home` key at all** in
   `messages/en.json`. No allowlist entries (home copy is fully content-owned).
   `common`, `pages`, `connectForm`, `designSystems`, `locale` remain untouched.
