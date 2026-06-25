# Page Copy Single Source (Home) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `@repo/content` the single source for all home-page copy, leaving `messages/en.json` with only shared UI chrome, with zero change to the rendered home page.

**Architecture:** Each home section that currently self-fetches copy from next-intl becomes a typed `PageSection` in `content/pages/en/home.json`, fed to its component as a `data` prop via `findSection` in `page.tsx`. We add one typed section schema per bespoke section to the existing `pageSectionSchema` discriminated union (the same pattern as the existing home-specific `techStackOverviewSection`), because the home sections read named, mobile-variant-rich fields that don't map cleanly onto generic types, and because the `custom`-section registry has no app-runtime bootstrap today. The **current rendered website output is the absolute source of truth**: copy is moved verbatim from `messages.home.*`, overwriting any divergent orphaned content twin.

**Tech Stack:** Next.js (App Router, `[locale]` segment), next-intl, Zod, `@repo/content` (loaders + schemas), Vitest.

## Global Constraints

- **Source of truth:** the current rendered website output. Copy moves **verbatim** from `messages.home.*`; where an orphaned content twin diverges, the messages copy overwrites it. No copy rewording.
- **No render change:** the home page must render byte-identically before/after. Component DOM, class names, and field access semantics stay the same — only the data *source* changes (`t('a.b')` → `data.a.b`).
- **Locale:** `en` is the only active locale. Do **not** add locale plumbing. All new content lives at `content/pages/en/home.json`.
- **Schema reuse:** reuse an existing `componentType` only where it fits the component's exact fields without adding section-specific fields to a shared type; otherwise add a dedicated typed section. Do not introduce the `custom`-section runtime registry.
- **Out of scope (do not touch):** tech-stack detail pages, Basecamp, the unrendered content sections (`home.triptych`, `home.parallelSocietyHeadline`, `home.parallelSociety`, `home.mountain`, `home.circlesCta`), and the `messages` namespaces `common`, `pages`, `connectForm`, `designSystems`, `locale`.
- **Immutability:** construct new objects; never mutate inputs. Match existing file/component patterns.
- **Commits:** commit per task (mid-stream commits are pre-authorised). Do **not** open a PR without explicit approval.
- **Attribution:** no `Co-Authored-By: Claude` trailer; human author only.

---

## File Structure

**Create:**
- `docs/superpowers/plans/2026-06-25-page-copy-single-source.md` (this file).

**Modify:**
- `packages/content/src/schemas/pages.ts` — add 7 typed section schemas + `ctas` on `techStackOverviewSection`; extend `pageSectionSchema` union.
- `content/pages/en/home.json` — add/replace 7 sections; add `ctas` to the `home.techStack` section.
- `apps/web/app/[locale]/page.tsx` — read all home copy via `findSection`; drop the `home.techStack` `getTranslations` call.
- `apps/web/components/sections/home/about-section.tsx`
- `apps/web/components/sections/home/social-proof-section.tsx`
- `apps/web/components/sections/home/feature-cards-section.tsx`
- `apps/web/components/sections/home/decide-section.tsx`
- `apps/web/components/sections/home/use-cases-section.tsx`
- `apps/web/components/sections/home/builder-portal-section.tsx`
- `apps/web/components/sections/home/start-building-section.tsx`
- `apps/web/components/sections/home/tech-stack-section.tsx` (CTA source only; already takes `ctas` prop)
- `apps/web/lib/__tests__/content-route-contracts.test.ts` — update the `home` contract to the new section set.
- `apps/web/messages/en.json` — delete the entire `home` namespace.

**Delete / rewrite:**
- `apps/web/lib/__tests__/home-about-copy.test.ts` — currently guards `messages.home.about.*`; rewrite to guard the content section instead.

**Add:**
- `apps/web/lib/__tests__/messages-no-home-copy.test.ts` — regression guard.

---

## Field Inventory (verbatim source → target)

The exact current copy lives in `apps/web/messages/en.json` under `home.<key>`. Each section's payload below mirrors the **field names the component reads today** (verified from each component's `t(...)` call sites). When a step says "copy verbatim", copy the value byte-for-byte from the current `messages.home.<key>` object.

| Section | Component | Reads (today) | Target componentType |
|---|---|---|---|
| socialProof | `social-proof-section.tsx` (client) | `headline1`, `headline2`, `manifestoCta` (+ dynamic stats stay props) | `homeSocialProof` |
| paths | `feature-cards-section.tsx` (client) | `title`, `kicker`, `body`, `build.{title,body,cta}`, `operate.{…}`, `activism.{…}` | `homeChoosePath` |
| decide | `decide-section.tsx` | `headline`, `headline2`, `headline3`, `bodyPart1..4` | `homeDecide` |
| startBuilding | `start-building-section.tsx` | `title`, `body`, `cta`, `cardCta`, `lambdaPrize`, `rfps`, `ideas`, `docs` | `homeStartBuilding` |
| about | `about-section.tsx` | `heading`, `headingMobile`, `problems.{debt,surveillance,corruption,stagnation}.{title,subtitle,body,fact1..}` | `homeAbout` |
| useCases | `use-cases-section.tsx` | `eyebrow`, `headline`, `headlineMobile`, `lambda`, `lambdaMobile`, `{secure,money,archives,donations}.{title,body}` | `homeUseCases` |
| builderPortal | `builder-portal-section.tsx` | `title`, `description`, `cta`, `featureChat`, `featureNode`, `featureTransactions` | `homeBuilderPortal` |
| techStack CTAs | `page.tsx` → `tech-stack-section.tsx` | `exploreStackCta`, `startBuildingCta`, `docsCta` | add `ctas[]` to existing `techStackOverview` |

> **Note on unused messages keys:** `messages.home.about` and `messages.home.builderPortal`/`useCases` contain extra keys the component does **not** read today (e.g. `about.quote/headline/body/intro/closing*`, `builderPortal.example*`). Only migrate fields the component actually reads (column 3). Dropping unread keys does not change the render. `messages.home.{build,node,circles}` are dead (no consumer; copy lives in content `home.triptych`) and are deleted with the rest of the namespace in Task 12.

---

## Section Migration Pattern (reference)

Every component task follows the same shape; the concrete code is given per task. The pattern:

1. **Test first:** add/update the component's test to render/drive the component from a `data` prop and assert the rendered text equals the migrated copy.
2. **Run → fail.**
3. **Refactor the component:** delete the `getTranslations`/`useTranslations` call; accept a typed `data` prop; replace each `t('x.y')` with `data.x.y` (same field names → same output).
4. **Run → pass.**
5. **Commit.**

`page.tsx` wiring (Task 11) is done once for all sections after the components accept props.

---

## Task 1: Commit the spec and this plan

**Files:**
- Create: `docs/superpowers/plans/2026-06-25-page-copy-single-source.md` (this file)
- Existing (uncommitted): `docs/superpowers/specs/2026-06-25-page-copy-single-source-design.md`

- [ ] **Step 1: Stage docs**

```bash
git add docs/superpowers/specs/2026-06-25-page-copy-single-source-design.md \
        docs/superpowers/plans/2026-06-25-page-copy-single-source.md
```

- [ ] **Step 2: Commit**

```bash
git commit -m "docs: add page-copy single-source spec and implementation plan"
```

---

## Task 2: Add typed home-section schemas

**Files:**
- Modify: `packages/content/src/schemas/pages.ts`
- Test: `packages/content/src/schemas/__tests__/home-sections.test.ts` (create; if the package has no `__tests__` dir under `schemas`, place it where existing schema tests live — check `packages/content` test layout first)

**Interfaces:**
- Produces (imported by `page.tsx` and components):
  - `HomeSocialProofSection`, `HomeChoosePathSection`, `HomeDecideSection`, `HomeStartBuildingSection`, `HomeAboutSection`, `HomeUseCasesSection`, `HomeBuilderPortalSection`
  - `TechStackOverviewSection.ctas?: ReadonlyArray<{ label: string; href: string; variant?: 'primary' | 'secondary' }>`
- Consumes: `ctaSchema`, `linkHrefSchema`, `sectionKeySchema` (already in `pages.ts`).

- [ ] **Step 1: Write the failing test**

Create `packages/content/src/schemas/__tests__/home-sections.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import {
  homeAboutSectionSchema,
  homeBuilderPortalSectionSchema,
  homeChoosePathSectionSchema,
  homeDecideSectionSchema,
  homeSocialProofSectionSchema,
  homeStartBuildingSectionSchema,
  homeUseCasesSectionSchema,
  pageSectionSchema,
} from '../pages'

describe('home section schemas', () => {
  it('parses a homeDecide section', () => {
    const value = {
      componentType: 'homeDecide',
      key: 'home.decide',
      headline: 'We get to decide what comes next.',
      headline2: 'Remain in the decline.',
      headline3: 'Or exit and build the alternative.',
      bodyParts: ['a', 'b', 'c', 'd'],
    }
    expect(homeDecideSectionSchema.parse(value)).toEqual(value)
    expect(pageSectionSchema.parse(value)).toEqual(value)
  })

  it('parses a homeChoosePath section with three paths', () => {
    const path = { title: 't', body: 'b', cta: 'c' }
    const value = {
      componentType: 'homeChoosePath',
      key: 'home.paths',
      title: 'Choose your path',
      kicker: 'k',
      body: 'b',
      build: path,
      operate: path,
      activism: path,
    }
    expect(homeChoosePathSectionSchema.parse(value)).toEqual(value)
  })

  it('rejects an unknown componentType in the union', () => {
    expect(() =>
      pageSectionSchema.parse({ componentType: 'nope', key: 'x' })
    ).toThrow()
  })

  it('parses each remaining home section schema with a minimal valid value', () => {
    expect(
      homeSocialProofSectionSchema.parse({
        componentType: 'homeSocialProof',
        key: 'home.socialProof',
        headline1: 'a',
        headline2: 'b',
        manifestoCta: 'c',
      }).componentType
    ).toBe('homeSocialProof')

    expect(
      homeStartBuildingSectionSchema.parse({
        componentType: 'homeStartBuilding',
        key: 'home.startBuilding',
        title: 't',
        body: 'b',
        cta: 'c',
        cardCta: 'cc',
        lambdaPrize: 'l',
        rfps: 'r',
        ideas: 'i',
        docs: 'd',
      }).componentType
    ).toBe('homeStartBuilding')

    const problem = { title: 't', subtitle: 's', body: 'b', facts: ['f'] }
    expect(
      homeAboutSectionSchema.parse({
        componentType: 'homeAbout',
        key: 'home.about',
        heading: 'h',
        headingMobile: 'hm',
        problems: {
          debt: problem,
          surveillance: problem,
          corruption: problem,
          stagnation: problem,
        },
      }).componentType
    ).toBe('homeAbout')

    const card = { title: 't', body: 'b' }
    expect(
      homeUseCasesSectionSchema.parse({
        componentType: 'homeUseCases',
        key: 'home.useCases',
        eyebrow: 'e',
        headline: 'h',
        headlineMobile: 'hm',
        lambda: 'l',
        lambdaMobile: 'lm',
        secure: card,
        money: card,
        archives: card,
        donations: card,
      }).componentType
    ).toBe('homeUseCases')

    expect(
      homeBuilderPortalSectionSchema.parse({
        componentType: 'homeBuilderPortal',
        key: 'home.builderPortal',
        title: 't',
        description: 'd',
        cta: 'c',
        featureChat: 'fc',
        featureNode: 'fn',
        featureTransactions: 'ft',
      }).componentType
    ).toBe('homeBuilderPortal')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @repo/content test home-sections`
Expected: FAIL — exports do not exist.

- [ ] **Step 3: Add the schemas**

In `packages/content/src/schemas/pages.ts`, first declare `homeCtaLinkSchema` **above** `techStackOverviewSectionSchema` (it is used by both that schema's new `ctas` field and the home block):

```ts
const homeCtaLinkSchema = z.object({
  label: z.string().min(1),
  href: linkHrefSchema,
  variant: z.enum(['primary', 'secondary']).optional(),
})
```

Add `ctas` to `techStackOverviewSectionSchema` (insert after its existing `cta` field):

```ts
  /** Optional explicit CTA list rendered by the home overview component. */
  ctas: z.array(homeCtaLinkSchema).optional(),
```

Then, after `featuredTextSectionSchema` and before `customSectionSchema`, add the home sections:

```ts
// ---------------------------------------------------------------------------
// Home-specific marketing sections
//
// These mirror the exact named fields their home components render. They are
// bespoke (like techStackOverviewSection) because the copy uses named slots
// and mobile-specific variants that do not map onto the generic section types.
// ---------------------------------------------------------------------------

export const homeSocialProofSectionSchema = z.object({
  componentType: z.literal('homeSocialProof'),
  key: sectionKeySchema,
  headline1: z.string().min(1),
  headline2: z.string().min(1),
  manifestoCta: z.string().min(1),
})
export type HomeSocialProofSection = z.infer<
  typeof homeSocialProofSectionSchema
>

const choosePathItemSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  cta: z.string().min(1),
})

export const homeChoosePathSectionSchema = z.object({
  componentType: z.literal('homeChoosePath'),
  key: sectionKeySchema,
  title: z.string().min(1),
  kicker: z.string().min(1),
  body: z.string().min(1),
  build: choosePathItemSchema,
  operate: choosePathItemSchema,
  activism: choosePathItemSchema,
})
export type HomeChoosePathSection = z.infer<typeof homeChoosePathSectionSchema>

export const homeDecideSectionSchema = z.object({
  componentType: z.literal('homeDecide'),
  key: sectionKeySchema,
  headline: z.string().min(1),
  headline2: z.string().min(1),
  headline3: z.string().min(1),
  /** Four desktop layout fragments rendered as separate spans. */
  bodyParts: z.array(z.string().min(1)).length(4),
})
export type HomeDecideSection = z.infer<typeof homeDecideSectionSchema>

export const homeStartBuildingSectionSchema = z.object({
  componentType: z.literal('homeStartBuilding'),
  key: sectionKeySchema,
  title: z.string().min(1),
  body: z.string().min(1),
  cta: z.string().min(1),
  cardCta: z.string().min(1),
  lambdaPrize: z.string().min(1),
  rfps: z.string().min(1),
  ideas: z.string().min(1),
  docs: z.string().min(1),
})
export type HomeStartBuildingSection = z.infer<
  typeof homeStartBuildingSectionSchema
>

const aboutProblemSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  body: z.string().min(1),
  facts: z.array(z.string().min(1)).min(1),
})

export const homeAboutSectionSchema = z.object({
  componentType: z.literal('homeAbout'),
  key: sectionKeySchema,
  heading: z.string().min(1),
  headingMobile: z.string().min(1),
  problems: z.object({
    debt: aboutProblemSchema,
    surveillance: aboutProblemSchema,
    corruption: aboutProblemSchema,
    stagnation: aboutProblemSchema,
  }),
})
export type HomeAboutSection = z.infer<typeof homeAboutSectionSchema>

const useCaseCardSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
})

export const homeUseCasesSectionSchema = z.object({
  componentType: z.literal('homeUseCases'),
  key: sectionKeySchema,
  eyebrow: z.string().min(1),
  headline: z.string().min(1),
  headlineMobile: z.string().min(1),
  /** Rich text with a single `<lambdaPrize>…</lambdaPrize>` link span. */
  lambda: z.string().min(1),
  lambdaMobile: z.string().min(1),
  secure: useCaseCardSchema,
  money: useCaseCardSchema,
  archives: useCaseCardSchema,
  donations: useCaseCardSchema,
})
export type HomeUseCasesSection = z.infer<typeof homeUseCasesSectionSchema>

export const homeBuilderPortalSectionSchema = z.object({
  componentType: z.literal('homeBuilderPortal'),
  key: sectionKeySchema,
  title: z.string().min(1),
  description: z.string().min(1),
  cta: z.string().min(1),
  featureChat: z.string().min(1),
  featureNode: z.string().min(1),
  featureTransactions: z.string().min(1),
})
export type HomeBuilderPortalSection = z.infer<
  typeof homeBuilderPortalSectionSchema
>
```

Finally extend the union:

```ts
export const pageSectionSchema = z.discriminatedUnion('componentType', [
  heroSectionSchema,
  richTextSectionSchema,
  cardGridSectionSchema,
  tableSectionSchema,
  giantSwitchSectionSchema,
  relatedArticlesSectionSchema,
  ctaPanelSectionSchema,
  gallerySectionSchema,
  techStackOverviewSectionSchema,
  featuredTextSectionSchema,
  homeSocialProofSectionSchema,
  homeChoosePathSectionSchema,
  homeDecideSectionSchema,
  homeStartBuildingSectionSchema,
  homeAboutSectionSchema,
  homeUseCasesSectionSchema,
  homeBuilderPortalSectionSchema,
  customSectionSchema,
])
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @repo/content test home-sections`
Expected: PASS.

- [ ] **Step 5: Typecheck the package**

Run: `pnpm --filter @repo/content check-types`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/content/src/schemas/pages.ts \
        packages/content/src/schemas/__tests__/home-sections.test.ts
git commit -m "feat(content): add typed home marketing section schemas + techStack ctas"
```

---

## Task 3: Populate `content/pages/en/home.json`

**Files:**
- Modify: `content/pages/en/home.json`
- Test: validation via `packages/content/scripts/validate.ts`

**Interfaces:**
- Consumes: schemas from Task 2.
- Produces: content sections keyed `home.socialProof`, `home.paths`, `home.decide`, `home.startBuilding`, `home.about`, `home.useCases`, `home.builderPortal`, and `ctas` on `home.techStack`.

- [ ] **Step 1: Add the seven sections to the `sections[]` array**

Insert these objects into `sections[]` (order is irrelevant — lookup is by `componentType`+`key`). **Replace** the existing orphaned `home.about` (richText), `home.useCases` (cardGrid), and `home.builderPortal` (ctaPanel) sections with the versions below. Copy each string value verbatim from the current `apps/web/messages/en.json` `home.<key>`.

```jsonc
{
  "componentType": "homeSocialProof",
  "key": "home.socialProof",
  "headline1": "Logos is not for everyone.",
  "headline2": "Logos is for people who are done waiting for permission.",
  "manifestoCta": "Read the manifesto"
},
{
  "componentType": "homeChoosePath",
  "key": "home.paths",
  "title": "Choose your path",
  "kicker": "The right response to broken systems is not to reform them but to build alongside them, and eventually, beyond them.",
  "body": "Take action to reclaim agency and find your purpose.",
  "build": {
    "title": "Build",
    "body": "Build privacy-first, decentralised applications. Read the docs, learn the stack, write code.",
    "cta": "Start Building"
  },
  "operate": {
    "title": "Operate",
    "body": "Run a node. Decentralise the network. Secure Logos. Setup takes minutes.",
    "cta": "Run a Node"
  },
  "activism": {
    "title": "Organise",
    "body": "Humanity evolved to organise. Some of our biggest problems lie in the breakdown of social trust, culture, and meaning. Join the Logos Movement to rebuild civil society together.",
    "cta": "Join the Movement"
  }
},
{
  "componentType": "homeDecide",
  "key": "home.decide",
  "headline": "We get to decide what comes next.",
  "headline2": "Remain in the decline.",
  "headline3": "Or exit and build the alternative.",
  "bodyParts": [
    "Logos is the private-by-default technology stack",
    "for parallel societies – communities,",
    "institutions, and economies that operate",
    "outside the legacy system."
  ]
},
{
  "componentType": "homeStartBuilding",
  "key": "home.startBuilding",
  "title": "Start building.",
  "body": "Everything you need to start building privacy-first, decentralised applications. Read the docs, study the stack, write code, explore builder programmes.",
  "cta": "Get Started",
  "cardCta": "Learn more",
  "lambdaPrize": "Lambda Prize",
  "rfps": "RFPs",
  "ideas": "Starter Issues and Community Ideas Repo",
  "docs": "View the Documentation"
},
{
  "componentType": "homeUseCases",
  "key": "home.useCases",
  "eyebrow": "Use Cases",
  "headline": "Privacy is the condition that makes free association possible.\nLogos is the technology stack that makes it the default.",
  "headlineMobile": "Privacy is the condition\nthat makes free association\npossible.\n\nLogos is the technology stack\nthat makes it the default.",
  "lambda": "Explore the applications Logos is funding through the <lambdaPrize>Lambda Prize</lambdaPrize>.",
  "lambdaMobile": "Explore the applications Logos is\nfunding through the <lambdaPrize>Lambda Prize</lambdaPrize>.",
  "secure": {
    "title": "Secure, private communications.",
    "body": "Resilient, private messaging for coordination in hostile environments."
  },
  "money": {
    "title": "Private, censorship-resistant money.",
    "body": "Private financial networks for storing and moving value without surveillance."
  },
  "archives": {
    "title": "Permanent, decentralised archives.",
    "body": "Decentralised network for storing knowledge, culture, and history beyond the reach of any single centralised actor."
  },
  "donations": {
    "title": "Anonymous donations and mutual aid.",
    "body": "Private payment network for funding people and causes without putting parties at risk."
  }
},
{
  "componentType": "homeBuilderPortal",
  "key": "home.builderPortal",
  "title": "Basecamp.\nThe local launcher\nfor the Logos stack.",
  "description": "Basecamp is a ready-to-run Logos distribution that you deploy on your own hardware, under your control. From the moment it’s installed, you’re standing on your own ground, not connecting to someone else’s infrastructure.\n\nThe Logos runtime runs locally, core modules are loaded, and essential applications — wallet, messenger, file sharing, blockchain explorer — are ready to use from day one.",
  "cta": "Learn more",
  "featureChat": "Load a basic chat app",
  "featureNode": "Run a node",
  "featureTransactions": "Execute private transactions"
}
```

For `home.about`, add the object below. Copy the `title`, `subtitle`, `body`, and each `fact*` string **verbatim** from `messages.home.about.problems.<key>`; collapse the numbered `fact1..factN` keys into the `facts` array in order:

```jsonc
{
  "componentType": "homeAbout",
  "key": "home.about",
  "heading": "Civil society is in decline. Our institutions are failing.\nReform from within cannot reverse this.",
  "headingMobile": "Civil society is in decline.\nOur institutions are failing.\nReform from within\ncannot reverse this.",
  "problems": {
    "debt": {
      "title": "Debt",
      "subtitle": "The bill lands on us",
      "body": "<verbatim messages.home.about.problems.debt.body>",
      "facts": [
        "<verbatim debt.fact1>",
        "<verbatim debt.fact2>",
        "<verbatim debt.fact3>",
        "<verbatim debt.fact4>"
      ]
    },
    "surveillance": {
      "title": "Surveillance",
      "subtitle": "Privacy is no longer the default",
      "body": "<verbatim surveillance.body>",
      "facts": ["<verbatim surveillance.fact1>", "<verbatim surveillance.fact2>", "<verbatim surveillance.fact3>"]
    },
    "corruption": {
      "title": "Corruption",
      "subtitle": "The rules are for sale",
      "body": "<verbatim corruption.body>",
      "facts": ["<verbatim corruption.fact1>", "<verbatim corruption.fact2>", "<verbatim corruption.fact3>"]
    },
    "stagnation": {
      "title": "Stagnation",
      "subtitle": "The system protects itself",
      "body": "<verbatim stagnation.body>",
      "facts": ["<verbatim stagnation.fact1>", "<verbatim stagnation.fact2>"]
    }
  }
}
```

> The `<verbatim …>` markers are the **only** place copy is sourced indirectly, to avoid transcription errors on the long fact strings. Read each value from `apps/web/messages/en.json` and paste it exactly — do not reword. After pasting, there must be no `<verbatim …>` text left in the file.

Add `ctas` to the existing `home.techStack` section object:

```jsonc
"ctas": [
  { "label": "Explore the Stack", "href": "/technology-stack" },
  { "label": "Start Building", "href": "/get-started", "variant": "secondary" },
  { "label": "Documentation", "href": "https://docs.logos.co/", "variant": "secondary" }
]
```

> The `href` values must match what `page.tsx` passes today: `ROUTES.technologyStack`, `ROUTES.getStarted`, `EXTERNAL_URLS.docs`. Read those constants from `apps/web/constants/routes.ts` and use their literal values (the placeholders above are the expected values — verify them).

- [ ] **Step 2: Validate content**

Run: `pnpm --filter @repo/content validate` (check `packages/content/package.json` for the exact script name; fall back to `pnpm --filter @repo/content exec tsx scripts/validate.ts`).
Expected: PASS — `home.json` validates against the updated `pageCopySchema`.

Then confirm no placeholders remain:

```bash
! grep -q "verbatim" content/pages/en/home.json && echo "OK: no placeholders"
```

- [ ] **Step 3: Commit**

```bash
git add content/pages/en/home.json
git commit -m "feat(content): migrate home copy into content/pages/en/home.json"
```

---

## Task 4: Refactor `social-proof-section.tsx` to props

**Files:**
- Modify: `apps/web/components/sections/home/social-proof-section.tsx`
- Test: `apps/web/components/sections/home/__tests__/social-proof-section.test.tsx` (create if absent)

**Interfaces:**
- Consumes: `HomeSocialProofSection` (Task 2).
- Produces: `SocialProofSection` accepts `data: HomeSocialProofSection` in addition to its existing `stats` / `winnableIssuesCount` props.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import SocialProofSection from '../social-proof-section'

const data = {
  componentType: 'homeSocialProof' as const,
  key: 'home.socialProof',
  headline1: 'Logos is not for everyone.',
  headline2: 'Logos is for people who are done waiting for permission.',
  manifestoCta: 'Read the manifesto',
}

describe('SocialProofSection', () => {
  it('renders headlines and CTA from data props', () => {
    render(
      <SocialProofSection
        data={data}
        stats={{ contributors: 1, nodeOperators: 1, circles: 1 }}
        winnableIssuesCount={1}
      />
    )
    expect(screen.getByText('Logos is not for everyone.')).toBeInTheDocument()
    expect(screen.getByText('Read the manifesto')).toBeInTheDocument()
  })
})
```

> Match the real `stats` prop shape before finalising the fixture — read `getSocialProofStats`'s return type and the component's existing props.

- [ ] **Step 2: Run → fail**

Run: `pnpm --filter web test social-proof-section`
Expected: FAIL — component still calls `useTranslations`.

- [ ] **Step 3: Refactor the component**

Remove `import { useTranslations } from 'next-intl'` and the `const t = useTranslations('home.socialProof')` line. Add `data: HomeSocialProofSection` to the props type (import the type from `@repo/content/schemas`). Replace:

```tsx
<span className="block">{t('headline1')}</span>
<span className="block text-[#848e88]">{t('headline2')}</span>
```
with
```tsx
<span className="block">{data.headline1}</span>
<span className="block text-[#848e88]">{data.headline2}</span>
```
and `{t('manifestoCta')}` → `{data.manifestoCta}`. Leave all dynamic stat rendering (`stats`, `winnableIssuesCount`) untouched.

- [ ] **Step 4: Run → pass**

Run: `pnpm --filter web test social-proof-section`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/sections/home/social-proof-section.tsx \
        apps/web/components/sections/home/__tests__/social-proof-section.test.tsx
git commit -m "refactor(web): feed social-proof section from content props"
```

---

## Task 5: Refactor `feature-cards-section.tsx` (paths) to props

**Files:**
- Modify: `apps/web/components/sections/home/feature-cards-section.tsx`
- Test: `apps/web/components/sections/home/__tests__/feature-cards-section.test.tsx` (create if absent)

**Interfaces:**
- Consumes: `HomeChoosePathSection`.
- Produces: `FeatureCardsSection` accepts `data: HomeChoosePathSection`.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import FeatureCardsSection from '../feature-cards-section'

const path = { title: 'Build', body: 'b', cta: 'Start Building' }
const data = {
  componentType: 'homeChoosePath' as const,
  key: 'home.paths',
  title: 'Choose your path',
  kicker: 'k',
  body: 'Take action.',
  build: path,
  operate: { title: 'Operate', body: 'b', cta: 'Run a Node' },
  activism: { title: 'Organise', body: 'b', cta: 'Join the Movement' },
}

describe('FeatureCardsSection', () => {
  it('renders path titles and CTAs from data props', () => {
    render(<FeatureCardsSection data={data} />)
    expect(screen.getByText('Choose your path')).toBeInTheDocument()
    expect(screen.getByText('Run a Node')).toBeInTheDocument()
    expect(screen.getByText('Join the Movement')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run → fail**

Run: `pnpm --filter web test feature-cards-section`
Expected: FAIL.

- [ ] **Step 3: Refactor the component**

Remove `import { useTranslations } from 'next-intl'` and `const t = useTranslations('home.paths')`. Add `data: HomeChoosePathSection` prop. Replace the card construction reads (`t('build.title')`, `t('build.body')`, `t('build.cta')`, and the same for `operate.*`/`activism.*`) with `data.build.title`, `data.build.body`, `data.build.cta`, etc. Replace the header reads `{t('title')}` → `{data.title}`, `{t('kicker')}` → `{data.kicker}`, `{t('body')}` → `{data.body}`. Keep the `'use client'` directive if present; it now receives `data` from the server parent.

- [ ] **Step 4: Run → pass**

Run: `pnpm --filter web test feature-cards-section`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/sections/home/feature-cards-section.tsx \
        apps/web/components/sections/home/__tests__/feature-cards-section.test.tsx
git commit -m "refactor(web): feed choose-your-path cards from content props"
```

---

## Task 6: Refactor `decide-section.tsx` to props

**Files:**
- Modify: `apps/web/components/sections/home/decide-section.tsx`
- Test: `apps/web/components/sections/home/__tests__/decide-section.test.tsx` (create if absent)

**Interfaces:**
- Consumes: `HomeDecideSection`.
- Produces: `DecideSection` accepts `data: HomeDecideSection` (drops the `locale` prop / `getTranslations`).

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import DecideSection from '../decide-section'

const data = {
  componentType: 'homeDecide' as const,
  key: 'home.decide',
  headline: 'We get to decide what comes next.',
  headline2: 'Remain in the decline.',
  headline3: 'Or exit and build the alternative.',
  bodyParts: ['p1', 'p2', 'p3', 'p4'],
}

describe('DecideSection', () => {
  it('renders headlines and body parts from data props', () => {
    render(<DecideSection data={data} />)
    expect(screen.getByText('We get to decide what comes next.')).toBeInTheDocument()
    expect(screen.getByText('p4')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run → fail**

Run: `pnpm --filter web test decide-section`
Expected: FAIL.

- [ ] **Step 3: Refactor the component**

Remove `getTranslations` import/usage and the `locale` param. Make the component synchronous (it no longer awaits). Accept `data: HomeDecideSection`. Replace `{t('headline')}`→`{data.headline}`, `{t('headline2')}`→`{data.headline2}`, `{t('headline3')}`→`{data.headline3}`, and `{t('bodyPart1')}`..`{t('bodyPart4')}` → `{data.bodyParts[0]}`..`{data.bodyParts[3]}` in the same span positions.

- [ ] **Step 4: Run → pass**

Run: `pnpm --filter web test decide-section`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/sections/home/decide-section.tsx \
        apps/web/components/sections/home/__tests__/decide-section.test.tsx
git commit -m "refactor(web): feed decide section from content props"
```

---

## Task 7: Refactor `start-building-section.tsx` to props

**Files:**
- Modify: `apps/web/components/sections/home/start-building-section.tsx`
- Test: `apps/web/components/sections/home/__tests__/start-building-section.test.tsx` (create if absent)

**Interfaces:**
- Consumes: `HomeStartBuildingSection`.
- Produces: `StartBuildingSection` accepts `data: HomeStartBuildingSection` (drops `locale`).

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import StartBuildingSection from '../start-building-section'

const data = {
  componentType: 'homeStartBuilding' as const,
  key: 'home.startBuilding',
  title: 'Start building.',
  body: 'b',
  cta: 'Get Started',
  cardCta: 'Learn more',
  lambdaPrize: 'Lambda Prize',
  rfps: 'RFPs',
  ideas: 'Starter Issues and Community Ideas Repo',
  docs: 'View the Documentation',
}

describe('StartBuildingSection', () => {
  it('renders title, CTA, and card labels from data props', () => {
    render(<StartBuildingSection data={data} />)
    expect(screen.getByText('Start building.')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
    expect(screen.getByText('Lambda Prize')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run → fail**

Run: `pnpm --filter web test start-building-section`
Expected: FAIL.

- [ ] **Step 3: Refactor the component**

Remove `getTranslations` import/usage and the `locale` param; make it synchronous. Accept `data: HomeStartBuildingSection`. The cards array (currently built from `t('lambdaPrize')`, `t('rfps')`, `t('ideas')`, `t('docs')`, `t('cardCta')`) becomes:

```tsx
const cards = [
  { title: data.lambdaPrize, href: ROUTES.lambdaPrize, cta: data.cardCta },
  { title: data.rfps, href: ROUTES.rfps, cta: data.cardCta },
  { title: data.ideas, href: /* keep the exact href the component uses today */ , cta: data.cardCta },
  { title: data.docs, href: EXTERNAL_URLS.docs, cta: data.cardCta },
]
```

> Read the component's current `href` values before editing and keep them identical. Replace `{t('title')}`→`{data.title}`, `{t('body')}`→`{data.body}`, `{t('cta')}`→`{data.cta}`.

- [ ] **Step 4: Run → pass**

Run: `pnpm --filter web test start-building-section`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/sections/home/start-building-section.tsx \
        apps/web/components/sections/home/__tests__/start-building-section.test.tsx
git commit -m "refactor(web): feed start-building section from content props"
```

---

## Task 8: Refactor `about-section.tsx` to props

**Files:**
- Modify: `apps/web/components/sections/home/about-section.tsx`
- Test: `apps/web/components/sections/home/__tests__/about-section.test.tsx` (create if absent)

**Interfaces:**
- Consumes: `HomeAboutSection`.
- Produces: `AboutSection` accepts `data: HomeAboutSection` (drops `locale`).

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import AboutSection from '../about-section'

const problem = (title: string) => ({
  title,
  subtitle: 's',
  body: 'b',
  facts: ['f1', 'f2'],
})
const data = {
  componentType: 'homeAbout' as const,
  key: 'home.about',
  heading: 'Civil society is in decline.',
  headingMobile: 'Civil society is in decline.',
  problems: {
    debt: problem('Debt'),
    surveillance: problem('Surveillance'),
    corruption: problem('Corruption'),
    stagnation: problem('Stagnation'),
  },
}

describe('AboutSection', () => {
  it('renders problem titles from data props', () => {
    render(<AboutSection data={data} />)
    expect(screen.getByText('Debt')).toBeInTheDocument()
    expect(screen.getByText('Stagnation')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run → fail**

Run: `pnpm --filter web test about-section`
Expected: FAIL.

- [ ] **Step 3: Refactor the component**

Remove `getTranslations` import/usage and `locale`; make synchronous. Accept `data: HomeAboutSection`. The component currently builds a `problems` array where each entry is `{ title, subtitle, body, facts: [...] }` read via `t('problems.<key>.*')`. Replace those reads so each entry comes from `data.problems.<key>` (the content shape already matches — `facts` is an array):

```tsx
const problems = [
  data.problems.debt,
  data.problems.surveillance,
  data.problems.corruption,
  data.problems.stagnation,
]
```

Replace `{t('headingMobile')}`→`{data.headingMobile}` and `{t('heading')}`→`{data.heading}`. Keep all rendering/markup of the problems list identical.

- [ ] **Step 4: Run → pass**

Run: `pnpm --filter web test about-section`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/sections/home/about-section.tsx \
        apps/web/components/sections/home/__tests__/about-section.test.tsx
git commit -m "refactor(web): feed about section from content props"
```

---

## Task 9: Refactor `use-cases-section.tsx` to props (incl. rich-text link)

**Files:**
- Modify: `apps/web/components/sections/home/use-cases-section.tsx`
- Test: `apps/web/components/sections/home/__tests__/use-cases-section.test.tsx` (create if absent)

**Interfaces:**
- Consumes: `HomeUseCasesSection`.
- Produces: `UseCasesSection` accepts `data: HomeUseCasesSection` (drops `locale`).

This is the only non-mechanical refactor: the component uses `t.rich('lambda'|'lambdaMobile', { lambdaPrize: (c) => <Link>…</Link> })` to render a `<lambdaPrize>` link span. After migration the string lives in content and next-intl's `t.rich` is gone, so render the link manually by splitting the string on the tag.

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import UseCasesSection from '../use-cases-section'

const card = (title: string) => ({ title, body: 'b' })
const data = {
  componentType: 'homeUseCases' as const,
  key: 'home.useCases',
  eyebrow: 'Use Cases',
  headline: 'Privacy is the condition.',
  headlineMobile: 'Privacy.',
  lambda: 'Explore the applications funded through the <lambdaPrize>Lambda Prize</lambdaPrize>.',
  lambdaMobile: 'Explore via <lambdaPrize>Lambda Prize</lambdaPrize>.',
  secure: card('Secure, private communications.'),
  money: card('Private, censorship-resistant money.'),
  archives: card('Permanent, decentralised archives.'),
  donations: card('Anonymous donations and mutual aid.'),
}

describe('UseCasesSection', () => {
  it('renders eyebrow, cards, and the Lambda Prize link', () => {
    render(<UseCasesSection data={data} />)
    expect(screen.getAllByText('Use Cases').length).toBeGreaterThan(0)
    expect(screen.getByText('Secure, private communications.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Lambda Prize' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run → fail**

Run: `pnpm --filter web test use-cases-section`
Expected: FAIL.

- [ ] **Step 3: Add a tag-splitting helper and refactor**

Replace the `t.rich(...)` renderer with a helper that splits on the single `<lambdaPrize>…</lambdaPrize>` tag and renders the inner text as the existing `Link`:

```tsx
import { Fragment, type ReactNode } from 'react'
// keep the existing Link import the component already uses

const LAMBDA_TAG = /<lambdaPrize>(.*?)<\/lambdaPrize>/

function renderLambdaPrizeText(value: string, href: string): ReactNode {
  const match = value.match(LAMBDA_TAG)
  if (!match) return value
  const [full, inner] = match
  const [before, after] = value.split(full)
  return (
    <Fragment>
      {before}
      <Link href={href}>{inner}</Link>
      {after}
    </Fragment>
  )
}
```

Remove `getTranslations`/`locale`; accept `data: HomeUseCasesSection`. Replace:
- `{t('headlineMobile')}` → `{data.headlineMobile}`, `{t('headline')}` → `{data.headline}`, `{t('eyebrow')}` → `{data.eyebrow}` (both desktop/mobile spots).
- `{renderLambdaPrizeText('lambdaMobile')}` → `{renderLambdaPrizeText(data.lambdaMobile, LAMBDA_PRIZE_HREF)}` and `{renderLambdaPrizeText()}` (the desktop call) → `{renderLambdaPrizeText(data.lambda, LAMBDA_PRIZE_HREF)}`.
- The card loop currently reads `t(`${card.key}.title`)` / `t(`${card.key}.body`)` where `card.key ∈ {secure, money, archives, donations}`. Replace with indexed access typed as `data[card.key as 'secure' | 'money' | 'archives' | 'donations'].title` / `.body`.

> Read the component's current Lambda Prize `Link` href and reuse it as `LAMBDA_PRIZE_HREF` (likely `ROUTES.lambdaPrize`). Keep all class names identical.

- [ ] **Step 4: Run → pass**

Run: `pnpm --filter web test use-cases-section`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/sections/home/use-cases-section.tsx \
        apps/web/components/sections/home/__tests__/use-cases-section.test.tsx
git commit -m "refactor(web): feed use-cases section from content props"
```

---

## Task 10: Refactor `builder-portal-section.tsx` to props

**Files:**
- Modify: `apps/web/components/sections/home/builder-portal-section.tsx`
- Test: `apps/web/components/sections/home/__tests__/builder-portal-section.test.tsx` (create if absent)

**Interfaces:**
- Consumes: `HomeBuilderPortalSection`.
- Produces: `BuilderPortalSection` accepts `data: HomeBuilderPortalSection` (drops `locale`).

- [ ] **Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import BuilderPortalSection from '../builder-portal-section'

const data = {
  componentType: 'homeBuilderPortal' as const,
  key: 'home.builderPortal',
  title: 'Basecamp.',
  description: 'd',
  cta: 'Learn more',
  featureChat: 'Load a basic chat app',
  featureNode: 'Run a node',
  featureTransactions: 'Execute private transactions',
}

describe('BuilderPortalSection', () => {
  it('renders title, CTA, and feature labels from data props', () => {
    render(<BuilderPortalSection data={data} />)
    expect(screen.getByText('Basecamp.')).toBeInTheDocument()
    expect(screen.getByText('Run a node')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run → fail**

Run: `pnpm --filter web test builder-portal-section`
Expected: FAIL.

- [ ] **Step 3: Refactor the component**

Remove `getTranslations`/`locale`; make synchronous. Accept `data: HomeBuilderPortalSection`. Replace `{t('title')}`→`{data.title}`, `{t('cta')}`→`{data.cta}`, `{t('description')}`→`{data.description}`, `label={t('featureChat')}`→`label={data.featureChat}`, and `featureNode`/`featureTransactions` likewise.

- [ ] **Step 4: Run → pass**

Run: `pnpm --filter web test builder-portal-section`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/sections/home/builder-portal-section.tsx \
        apps/web/components/sections/home/__tests__/builder-portal-section.test.tsx
git commit -m "refactor(web): feed builder-portal section from content props"
```

---

## Task 11: Wire `page.tsx` to feed every section from content

**Files:**
- Modify: `apps/web/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: all `Home*Section` types (Task 2) + the refactored components (Tasks 4–10).

- [ ] **Step 1: Update imports and section lookups**

Add the new types to the `@repo/content/schemas` import. After the existing `hero`/`techStack`/`blog` lookups, add:

```tsx
const socialProof = findSection<HomeSocialProofSection>(page.sections, 'homeSocialProof', 'home.socialProof')
const paths = findSection<HomeChoosePathSection>(page.sections, 'homeChoosePath', 'home.paths')
const about = findSection<HomeAboutSection>(page.sections, 'homeAbout', 'home.about')
const decide = findSection<HomeDecideSection>(page.sections, 'homeDecide', 'home.decide')
const useCases = findSection<HomeUseCasesSection>(page.sections, 'homeUseCases', 'home.useCases')
const builderPortal = findSection<HomeBuilderPortalSection>(page.sections, 'homeBuilderPortal', 'home.builderPortal')
const startBuilding = findSection<HomeStartBuildingSection>(page.sections, 'homeStartBuilding', 'home.startBuilding')
```

- [ ] **Step 2: Drop the messages dependency and pass props**

Remove the `getTranslations({ locale, namespace: 'home.techStack' })` call from the `Promise.all` (it should load only `getPageCopy(ROUTE, locale)`), and remove the now-unused `getTranslations` import if nothing else uses it. Update the JSX:

```tsx
<SocialProofSection data={socialProof} stats={socialProofStats} winnableIssuesCount={winnableIssuesCount} />
<FeatureCardsSection data={paths} />
<AboutSection data={about} />
<DecideSection data={decide} />
<UseCasesSection data={useCases} />
<BuilderPortalSection data={builderPortal} />
<TechStackSection
  data={techStack}
  networkingHref={ROUTES.networking}
  foundationHref={ROUTES.technologyStack}
  desktopAt1367
  bottomSpacingClassName="pb-[112px]"
  ctas={techStack.ctas}
/>
<StartBuildingSection data={startBuilding} />
```

> `techStack.ctas` now comes from content (Task 3). `TechStackSection`'s `ctas` prop and the schema's `ctas` are both `{ label, href, variant? }`; if the prop type is `readonly`, the schema array satisfies it. If `techStack.ctas` could be undefined per the schema, the component already has a `data.cta` fallback — but content now always provides `ctas`, so pass it directly.

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter web check-types`
Expected: passes.

> The contract test (`content-route-contracts`) will still fail here because its `home` contract lists the old section set — that is fixed in Task 12. Do not "fix" it by editing the contract in this task.

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/[locale]/page.tsx
git commit -m "refactor(web): resolve all home sections from content in page.tsx"
```

---

## Task 12: Delete the `home` namespace from messages and fix coupled tests

**Files:**
- Modify: `apps/web/messages/en.json` (delete `home`)
- Modify: `apps/web/lib/__tests__/content-route-contracts.test.ts` (update `home` contract)
- Delete + replace: `apps/web/lib/__tests__/home-about-copy.test.ts`

**Interfaces:**
- Consumes: content sections (Task 3), refactored page (Task 11).

- [ ] **Step 1: Update the `home` contract**

In `content-route-contracts.test.ts`, replace the `home` contract's `sections` array with the sections the page now consumes:

```ts
sections: [
  { componentType: 'hero', key: 'home.atf' },
  { componentType: 'homeSocialProof', key: 'home.socialProof' },
  { componentType: 'homeChoosePath', key: 'home.paths' },
  { componentType: 'homeAbout', key: 'home.about' },
  { componentType: 'homeDecide', key: 'home.decide' },
  { componentType: 'homeUseCases', key: 'home.useCases' },
  { componentType: 'homeBuilderPortal', key: 'home.builderPortal' },
  { componentType: 'techStackOverview', key: 'home.techStack' },
  { componentType: 'homeStartBuilding', key: 'home.startBuilding' },
  { componentType: 'relatedArticles', key: 'home.blog' },
],
```

> The previously-listed `cardGrid home.useCases` becomes `homeUseCases`; the previously-listed featuredText/gallery sections (`home.parallelSocietyHeadline`, `home.parallelSociety`, `home.mountain`, `home.circlesCta`) are removed from the contract because the page no longer renders them and they are out of scope. Leave the other route contracts (technology-stack, blockchain, networking, etc.) untouched. Do **not** remove the `messages.pages.movement` assertions — those guard chrome that stays.

- [ ] **Step 2: Replace the about-copy test**

Delete `apps/web/lib/__tests__/home-about-copy.test.ts` and create `apps/web/lib/__tests__/home-about-content.test.ts`:

```ts
import { getPageCopy } from '@repo/content/loaders'
import type { HomeAboutSection } from '@repo/content/schemas'
import { describe, expect, it } from 'vitest'

import { ROUTES } from '@/constants/routes'
import { createSectionFinder } from '@/lib/page-sections'

describe('homepage about content', () => {
  it('keeps every about problem populated', async () => {
    const page = await getPageCopy(ROUTES.home, 'en')
    const about = createSectionFinder('home')<HomeAboutSection>(
      page.sections,
      'homeAbout',
      'home.about'
    )
    for (const problem of Object.values(about.problems)) {
      expect(problem.title.trim().length).toBeGreaterThan(0)
      expect(problem.facts.length).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 3: Delete the `home` namespace from messages**

In `apps/web/messages/en.json`, remove the entire `"home": { … }` key (all 11 sub-keys including the dead `build`/`node`/`circles`). Leave `locale`, `common`, `designSystems`, `pages`, `connectForm` intact.

- [ ] **Step 4: Run the full web test suite**

Run: `pnpm --filter web test`
Expected: PASS (contract test now matches; about-content test passes; no test references `messages.home`). If any other test references `messages.home.*`, update it to read the content section instead (grep first: `grep -rn "messages.home" apps/web`).

- [ ] **Step 5: Commit**

```bash
git add apps/web/messages/en.json \
        apps/web/lib/__tests__/content-route-contracts.test.ts \
        apps/web/lib/__tests__/home-about-content.test.ts
git rm apps/web/lib/__tests__/home-about-copy.test.ts
git commit -m "chore(web): remove home page copy from messages; guard via content"
```

---

## Task 13: Regression guard — no home copy in messages

**Files:**
- Create: `apps/web/lib/__tests__/messages-no-home-copy.test.ts`

**Interfaces:**
- Consumes: `apps/web/messages/en.json`.

- [ ] **Step 1: Write the test**

```ts
import { describe, expect, it } from 'vitest'

import messages from '../../messages/en.json' with { type: 'json' }

describe('messages ownership contract', () => {
  it('contains no home page-copy namespace (content owns home copy)', () => {
    expect(Object.keys(messages)).not.toContain('home')
  })

  it('keeps shared chrome namespaces', () => {
    for (const key of ['common', 'pages', 'connectForm'] as const) {
      expect(messages).toHaveProperty(key)
    }
  })
})
```

- [ ] **Step 2: Run → pass**

Run: `pnpm --filter web test messages-no-home-copy`
Expected: PASS.

- [ ] **Step 3: Full verification**

Run: `pnpm --filter @repo/content validate`
Run: `pnpm --filter @repo/content test`
Run: `pnpm --filter web check-types`
Run: `pnpm --filter web test`
Run: `pnpm --filter web build` (confirms the home page builds with content-only copy)
Expected: all PASS.

- [ ] **Step 4: Manual visual check**

Start the app, open `/en`, and confirm all 10 sections render identically to before: hero, social proof, choose-your-path cards, about (4 problems), decide, use cases (+ Lambda Prize link), builder portal, tech stack (+ 3 CTAs), start building, blog.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/__tests__/messages-no-home-copy.test.ts
git commit -m "test(web): regression guard — no home copy in messages"
```

---

## Self-Review

**Spec coverage:**
- Ownership contract (§2) → enforced by Task 13 guard + Task 3 content population.
- Inventory corrections — `build`/`node`/`circles` deleted not migrated → Task 12 Step 3 (whole-namespace delete).
- Divergent duplicates reconciled to rendered output → Tasks 3 + 8/9/10 (content shaped to component fields, verbatim from messages).
- techStack split merged → Task 2 (`ctas` field) + Task 3 (content `ctas`) + Task 11 (page reads `techStack.ctas`).
- Regression guard (§6) → Task 13.
- Out-of-scope sections untouched → no task edits triptych/parallelSociety/mountain/circlesCta; messages `common`/`pages` preserved (Task 12 Step 1 note + Task 13 chrome assertion).

**Placeholder scan:** the only indirection is the `<verbatim …>` markers in Task 3's `home.about` (long fact strings), with an explicit instruction + grep check to ensure none remain. All schema/component/test code is concrete.

**Type consistency:** section type names (`Home*Section`) and `componentType` literals (`homeSocialProof`, `homeChoosePath`, `homeDecide`, `homeStartBuilding`, `homeAbout`, `homeUseCases`, `homeBuilderPortal`) are used identically in Task 2 (definition), Task 3 (content), Task 11 (page lookup), and Task 12 (contract). `bodyParts` (array, length 4) is consistent between schema, content, and the `decide-section` refactor. `ctas` shape `{ label, href, variant? }` is consistent across schema, content, and `page.tsx`.

> **Pre-flight for the implementer:** several steps say "read the component's current X before editing" (exact `href` constants, `stats` prop shape, `Link` import, whether a component is already `'use client'`). Honour those — the diffs are mechanical but the surrounding values must match today's code exactly to preserve the render.
