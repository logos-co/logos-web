# Code-Quality Follow-ups

This document tracks items that were identified during the code-quality pass
but need design or infrastructure decisions before code can land. Each
section spells out the gap, the proposed fix, and the artifacts the
implementer needs.

---

## Typography token migration

### Status

Open. Tokens exist in `@repo/tokens`; raw `font-*` + `text-[Npx]` patterns
appear ~171 times across the codebase. Migrating without a concurrent Figma
spec audit risks visible regressions on typography-heavy frames (press,
design-systems, blog).

### What "done" looks like

1. Inventory the top-five token equivalences from raw classes:

   | Raw pattern | Proposed token |
   | --- | --- |
   | `font-mono text-[10px] font-semibold leading-[1.35] uppercase` | `text-eyebrow` |
   | `font-mono text-[10px] leading-[1.3]` | `text-mono-s` |
   | `font-display text-[36px] leading-none tracking-[-0.03em]` | `text-h3-serif` |
   | `font-sans text-[18px] leading-[1.15] tracking-[-0.01em]` | `text-subhead-sans` |
   | `font-sans text-[14px] leading-[1.2]` | `text-body-sans` |

2. Cross-check each pattern against the corresponding Figma frame; if a frame
   uses a one-off variant, keep the raw class and add an inline comment so the
   next reader doesn't "fix" it.
3. Replace the raw classes with the token name file by file. Keep one PR per
   feature area (press, builders-hub, circles) for safer Figma diffing.
4. After migration, add an ESLint rule (`no-restricted-syntax`) that flags
   `font-mono`/`font-sans`/`font-display` outside the tokens file.

### Why not yet

The work is mechanical *only* if the existing raw classes already match the
token spec. A spot check found at least three near-matches that diverge from
the token by 1px or 0.05em — those would silently change visuals when the
token replaces them.

---

## `alt=""` audit

### Status

Open. 45 instances of `alt=""` across `apps/web`.

### Required content-schema change

In `packages/content/src/schemas/press.ts` and `circles.ts`, the `image` field
currently allows `alt: ''`. Make `alt` required + non-empty for content
images so `articlesToCards` can drop its `|| article.title` fallback.

```ts
// proposed
image: z.object({
  src: z.string().min(1),
  alt: z.string().min(1, 'image.alt must describe the image; use a decorative container if the image is purely visual'),
}),
```

### Component-side rule

| Image purpose | `alt` value |
| --- | --- |
| Article thumbnail / podcast cover | `{title}` (or schema-supplied caption) |
| Decorative blur / pattern background | `alt=""` (intentional, leave a comment) |
| Hero foreground portrait | descriptive copy from translations |

### Action items

1. Tighten the schemas above.
2. Re-run `getPageCopy` integration to surface any data files that violate.
3. Switch `articlesToCards` to read `article.image.alt` directly (no fallback).
4. Audit all 45 sites; add a comment next to each *intentional* `alt=""`.
5. Enable `eslint-plugin-jsx-a11y/alt-text` at error level.

---

## E2E happy-path coverage

### Status

Open. No test runner is configured in `apps/web` yet.

### Bootstrap path

```bash
pnpm add -D playwright @playwright/test --filter web
pnpm exec playwright install --with-deps
```

Add to `apps/web/package.json`:

```json
"scripts": {
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

### First flows to cover (in order of incident risk)

1. `/` — home renders, hero loads, navigation overlay opens/closes.
2. `/press` — articles list renders ≥ one article from the API; cards link
   externally.
3. `/circles` — settings + circles + events all resolve; map renders.
4. `/active-circles` — Hasura fetch path works; stat cards show non-zero data.
5. `/builders-hub/ideas/[slug]` and `/builders-hub/rfps/[slug]` — both happy
   path and `notFound()` path (use a known-bad slug).

### Why not yet

Playwright bootstrap and CI integration is its own multi-hour task; bundling
it into the quality pass would obscure the diff.

---

## `default` → `named` export cleanup

### Status

Mostly safe. Constraint: Next.js *requires* `export default` on `page.tsx`,
`layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, `template.tsx`,
`route.ts`, and `middleware.ts`.

### Conversion targets (safe)

- `apps/web/components/locale/locale-switcher-select.tsx` — default
  `LocaleSwitcherSelect` → named export.
- `apps/web/components/site-header/site-header-client.tsx` — `SiteHeaderClient`.
- All `components/sections/**/*.tsx` files using `export default` — switch to
  named export, update barrel re-exports accordingly.

### Conversion targets (must stay default)

- `apps/web/app/**/page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`,
  `not-found.tsx`.

### Why not yet

Each conversion is mechanical but cascades through the per-section barrels.
Doing it incrementally (one feature area per PR) avoids a 50-file diff.

---

## Vitest infra

### Already done

- `apps/web/vitest.config.ts` and the first test file under
  `apps/web/lib/__tests__/` are in place.

### Still required

- Add the `test` script to `apps/web/package.json` (`vitest run`).
- Wire CI to run it (`turbo run test`).
- Author tests for `lib/reward.ts`, `lib/cn.ts`, `lib/page-sections.ts`.
- Configure coverage thresholds (suggested: 80% for `lib/`).

---

## `cn()` adoption sweep

### Status

Open. `lib/cn.ts` exists; ~25 components still use template-literal
className composition.

### Codemod

Many call sites match the pattern:

```tsx
className={`base-classes ${dynamicClass} ${className ?? ''}`}
```

A safe rewriter is `jscodeshift` with a small transform that detects this
exact shape and replaces it with `cn('base-classes', dynamicClass, className)`.
Hand-written variants will need manual review.

### Why not yet

A naive sed across 25 files breaks template literals that interpolate
non-className expressions; a real codemod is the right tool but requires
setup.

---

## `resolveLocale` + `LocaleParams` adoption

### Status

Open. Helpers in `lib/route-params.ts`; 13 page.tsx files still inline the
`isActiveLocale(locale)` guard, 36 still inline `params: Promise<{ locale }>`.

### Codemod

The transformation is uniform:

```diff
- export default async function FooPage({
-   params,
- }: {
-   params: Promise<{ locale: string }>
- }) {
-   const { locale } = await params
-   if (!isActiveLocale(locale)) {
-     throw new Error(`FooPage received non-active locale "${locale}"`)
-   }
+ export default async function FooPage({ params }: LocaleParams) {
+   const locale = await resolveLocale(params, 'FooPage')
```

A jscodeshift transform that recognises the function-name string in the
error message keeps the page-name argument correct.
