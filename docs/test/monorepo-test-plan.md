# Monorepo Test Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dense, reliable test coverage across the CMS, web static export, shared content packages, monorepo build gates, and performance-sensitive user paths.

**Architecture:** Keep unit tests close to the code they protect, add a small script layer for static-export and performance smoke checks, and make root-level CI commands compose existing workspace scripts instead of hiding failures behind one large runner. Browser tests should run against the exported `apps/web/out` artifact because production is static.

**Tech Stack:** Node test runner for CMS/package services, Vitest for web pure functions, Playwright for static export page loading and performance smoke checks, Turborepo for monorepo gates, Payload CMS test doubles for workflow services, and `@repo/content` loaders as the source of route/content truth.

---

## Current Baseline

- Root commands already exist: `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm check-types`, `pnpm generate-types`.
- CMS has Node test coverage for content workflow helpers and collection hook timing.
- Web has Vitest coverage for selected `apps/web/lib` functions only.
- `packages/content` has validation and GitHub promotion tests, but no package-level `test` script.
- Static export is produced by `apps/web` via `next build` and `scripts/strip-default-locale-prefix.sh`.
- There is no Playwright-based exported-page smoke test, no route inventory assertion, no accessibility smoke gate, and no performance budget gate.

## Target Test Matrix

| Layer              | Command                                  | Scope                             | Required in CI          |
| ------------------ | ---------------------------------------- | --------------------------------- | ----------------------- |
| Monorepo install   | `CI=true pnpm install --frozen-lockfile` | Lockfile and package policy       | Yes                     |
| Type safety        | `pnpm check-types`                       | All workspaces                    | Yes                     |
| Lint               | `pnpm lint`                              | All workspaces                    | Yes                     |
| Unit tests         | `pnpm test`                              | CMS, web, content packages        | Yes                     |
| Content validation | `pnpm --filter @repo/content validate`   | `content/**` fixtures and loaders | Yes                     |
| CMS build          | `pnpm --filter cms build`                | Payload/Next admin app            | Yes, with test env      |
| Web static export  | `pnpm --filter web build`                | Static `apps/web/out` artifact    | Yes                     |
| Static page smoke  | `pnpm --filter web test:static`          | Every exported HTML route loads   | Yes                     |
| Performance smoke  | `pnpm --filter web test:perf`            | Critical exported routes          | Yes, soft gate at first |
| Full release gate  | `pnpm test:release`                      | Ordered aggregate                 | Yes before deploy       |

## Test Data Rules

- Tests must not call the real GitHub API unless the command name contains `smoke` and requires explicit env vars.
- Tests must not require a production database.
- CMS content-workflow tests should use typed in-memory Payload doubles.
- Web static tests must run against `apps/web/out`, not `next dev`.
- Route inventories must be derived from actual generated files or content loaders, not hand-maintained URL lists.
- Performance budgets should start as warning-only in local runs, then become CI-blocking after baseline numbers are recorded.

---

## Task 1: Add Root Test Scripts and CI Gate Shape

**Files:**

- Modify: `package.json`
- Modify: `turbo.json`

- [ ] **Step 1: Add explicit root scripts**

Add scripts that separate fast local checks from release-grade checks:

```json
{
  "scripts": {
    "test": "turbo run test",
    "test:static": "pnpm --filter web test:static",
    "test:perf": "pnpm --filter web test:perf",
    "test:release": "pnpm lint && pnpm check-types && pnpm test && pnpm --filter @repo/content validate && pnpm build && pnpm test:static && pnpm test:perf"
  }
}
```

- [ ] **Step 2: Add Turbo pipeline entries**

Extend `turbo.json` so static and performance tests depend on the web build artifact:

```json
{
  "tasks": {
    "test:static": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "test:perf": {
      "dependsOn": ["build"],
      "outputs": []
    }
  }
}
```

- [ ] **Step 3: Verify root commands are discoverable**

Run:

```bash
pnpm test:release
```

Expected: it may fail on missing future scripts until later tasks land. After Task 7, it must pass without missing-script errors.

- [ ] **Step 4: Commit**

```bash
git add package.json turbo.json
git commit -m "test: add monorepo release test gates"
```

---

## Task 2: Expand CMS Unit and Workflow Coverage

**Files:**

- Create: `apps/cms/src/services/content-workflow/__tests__/save-as-pr.test.ts`
- Create: `apps/cms/src/services/content-workflow/__tests__/merge-pr.test.ts`
- Create: `apps/cms/src/app/(payload)/api/content-workflow/__tests__/route-contracts.test.ts`
- Modify: `apps/cms/package.json`

- [ ] **Step 1: Cover `saveAsPullRequest` branch decisions**

Add Node tests that mock `@repo/content/github` and assert:

- empty change list throws
- stale CCR rows are marked `closed`
- live CCR rows commit to the existing branch
- live GitHub PR touching the target path is reused
- multiple live PRs touching the same target path throw
- referenced `/cms/uploads/*` files are included in the commit

Use test doubles shaped like this:

```ts
const payload = {
  find: async () => ({ docs: [] }),
  create: async ({ data }: { data: unknown }) => ({ id: 'ccr-1', ...data }),
  update: async ({ id, data }: { id: string; data: unknown }) => ({
    id,
    ...data,
  }),
}
```

- [ ] **Step 2: Cover merge behavior**

Add tests for `mergeContentPullRequest`:

- updates matching open CCR to `merged`
- returns `contentChangeRequestId: null` when GitHub has a PR but Payload has no row
- propagates merge errors without mutating CCR state

- [ ] **Step 3: Add route contract tests**

For `recent-pr`, `merge-pr`, and `sync-production`, assert:

- unauthenticated requests return `401`
- invalid body/query input returns `400`
- GitHub config failures return `500`
- service-level failures return `422` or `502` as implemented

- [ ] **Step 4: Ensure Node tests include app route tests**

Keep the CMS test script broad enough:

```json
{
  "scripts": {
    "test": "node --import tsx --test \"src/**/*.test.ts\""
  }
}
```

- [ ] **Step 5: Verify**

Run:

```bash
pnpm --filter cms test
pnpm --filter cms check-types
pnpm --filter cms lint
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add apps/cms
git commit -m "test: cover cms content workflow contracts"
```

---

## Task 3: Add Content Package Tests as First-Class Monorepo Tests

**Files:**

- Modify: `packages/content/package.json`
- Create: `packages/content/src/loaders/__tests__/pages.test.ts`
- Create: `packages/content/src/loaders/__tests__/builders-hub.test.ts`
- Create: `packages/content/src/loaders/__tests__/circles.test.ts`
- Create: `packages/content/src/loaders/__tests__/site.test.ts`
- Create: `packages/content/src/media/__tests__/media.test.ts`

- [ ] **Step 1: Add a package test script**

```json
{
  "scripts": {
    "test": "node --import tsx --test \"src/**/*.test.ts\""
  }
}
```

- [ ] **Step 2: Cover loaders**

Each loader test must verify:

- required English fixtures load
- missing required fixture throws with the missing path
- schema-invalid fixture throws before returning data
- ordering rules are stable
- inactive or archived content is filtered only where the web UI expects filtering

- [ ] **Step 3: Cover media helpers**

Assert media normalization behavior for:

- local `/cms/uploads/*` paths
- external HTTPS URLs
- image dimensions preserved when present
- missing alt text rejected only when the schema requires it

- [ ] **Step 4: Verify**

Run:

```bash
pnpm --filter @repo/content test
pnpm --filter @repo/content validate
pnpm test
```

Expected: package tests run through the root `pnpm test` pipeline.

- [ ] **Step 5: Commit**

```bash
git add packages/content
git commit -m "test: add content loader coverage"
```

---

## Task 4: Expand Web Unit and Route Inventory Coverage

**Files:**

- Modify: `apps/web/vitest.config.ts`
- Create: `apps/web/lib/__tests__/routes.test.ts`
- Create: `apps/web/lib/__tests__/metadata.test.ts`
- Create: `apps/web/lib/__tests__/static-paths.test.ts`
- Create: `apps/web/test/route-inventory.ts`

- [ ] **Step 1: Include web test files in Vitest**

```ts
export default defineConfig({
  test: {
    environment: 'node',
    include: [
      'lib/**/*.test.ts',
      'lib/**/__tests__/**/*.test.ts',
      'test/**/*.test.ts',
      'test/**/__tests__/**/*.test.ts',
    ],
  },
})
```

- [ ] **Step 2: Build a route inventory helper**

`apps/web/test/route-inventory.ts` should export:

```ts
export interface ExpectedRoute {
  path: string
  source: 'app' | 'content'
}
```

It should combine:

- static routes from `apps/web/app/[locale]`
- content-driven circle routes
- content-driven Builders Hub idea and RFP detail routes
- pagination routes when generated

- [ ] **Step 3: Assert metadata contracts**

Tests should verify:

- every route can build metadata without throwing
- canonical URLs do not include `/en` after default-locale stripping
- no metadata title/description is empty
- Open Graph image URLs are valid absolute or root-relative URLs

- [ ] **Step 4: Assert link policy remains strict**

Keep `apps/web/lib/__tests__/link-policy.test.ts` as a blocker, and add cases for any new CMS-driven URL fields so bad forum or deprecated links cannot re-enter content.

- [ ] **Step 5: Verify**

Run:

```bash
pnpm --filter web test
pnpm --filter web check-types
pnpm --filter web lint
```

Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "test: expand web route and metadata coverage"
```

---

## Task 5: Add Static Export Page Loading Tests

**Files:**

- Modify: `apps/web/package.json`
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/test/static-export/serve-export.ts`
- Create: `apps/web/test/static-export/routes.test.ts`
- Create: `apps/web/test/static-export/assets.test.ts`

- [ ] **Step 1: Add Playwright dependency**

Add to `apps/web/package.json` dev dependencies:

```json
{
  "devDependencies": {
    "@playwright/test": "^1.57.0"
  }
}
```

- [ ] **Step 2: Add scripts**

```json
{
  "scripts": {
    "test:static": "playwright test --config playwright.config.ts test/static-export",
    "test:static:update": "playwright test --config playwright.config.ts test/static-export --update-snapshots"
  }
}
```

- [ ] **Step 3: Serve the exported artifact**

`serve-export.ts` should start:

```bash
python3 -m http.server 4173 --directory out
```

The helper must fail fast if `apps/web/out/index.html` does not exist and print `Run pnpm --filter web build first`.

- [ ] **Step 4: Test every exported HTML page**

The Playwright test should discover `out/**/*.html`, map each file to its URL, and assert:

- status is 200
- page title is non-empty
- no visible Next.js error page markers
- no console errors
- no failed image, script, CSS, or font requests
- body text is non-empty
- primary navigation and footer are present

- [ ] **Step 5: Test static assets**

For each exported HTML page:

- collect `img[src]`, `link[rel="stylesheet"]`, `script[src]`, and preload URLs
- request each root-relative asset
- assert status is 200
- assert content type matches the asset class

- [ ] **Step 6: Verify**

Run:

```bash
pnpm --filter web build
pnpm --filter web test:static
```

Expected: every exported route in `apps/web/out` loads from the static server.

- [ ] **Step 7: Commit**

```bash
git add apps/web package.json pnpm-lock.yaml
git commit -m "test: add static export smoke coverage"
```

---

## Task 6: Add CMS Build and Monorepo Build Verification

**Files:**

- Modify: `apps/cms/package.json`
- Create: `apps/cms/scripts/verify-build-env.ts`
- Create: `docs/test/build-env.md`

- [ ] **Step 1: Add build env verification script**

The script should verify required CMS build env names before the build starts:

```ts
const required = [
  'PAYLOAD_SECRET',
  'DATABASE_URL',
  'NEXT_PUBLIC_SERVER_URL',
  'NEXT_PUBLIC_WEB_URL',
]
```

It should exit with code `1` and list missing names if any are absent.

- [ ] **Step 2: Add a CMS build check script**

```json
{
  "scripts": {
    "build:check": "tsx scripts/verify-build-env.ts && pnpm build"
  }
}
```

- [ ] **Step 3: Document local test env**

`docs/test/build-env.md` should list minimal non-production values for local build tests, including that production-like CMS builds must not silently fall back to localhost.

- [ ] **Step 4: Verify monorepo build**

Run:

```bash
pnpm build
pnpm --filter cms build
pnpm --filter web build
```

Expected: all builds pass with explicit test env values.

- [ ] **Step 5: Commit**

```bash
git add apps/cms docs/test/build-env.md
git commit -m "test: document and verify build env gates"
```

---

## Task 7: Add Performance Smoke Tests

**Files:**

- Modify: `apps/web/package.json`
- Create: `apps/web/test/performance/budgets.ts`
- Create: `apps/web/test/performance/export-performance.test.ts`
- Create: `apps/web/test/performance/report.ts`

- [ ] **Step 1: Add script**

```json
{
  "scripts": {
    "test:perf": "playwright test --config playwright.config.ts test/performance"
  }
}
```

- [ ] **Step 2: Define initial budgets**

Use warning-level budgets first:

```ts
export const performanceBudgets = {
  maxHtmlBytes: 250_000,
  maxTotalTransferBytes: 2_500_000,
  maxImageBytes: 1_500_000,
  maxScriptBytes: 750_000,
  maxCssBytes: 500_000,
  maxDomContentLoadedMs: 2_500,
}
```

- [ ] **Step 3: Test critical routes**

Cover at least:

- `/`
- `/about`
- `/active-circles`
- `/builders-hub`
- `/builders-hub/rfps`
- `/builders-hub/ideas`
- `/circles`
- `/technology-stack`
- `/brand-kit`
- `/press`

- [ ] **Step 4: Collect request sizes**

The test should aggregate transfer size by resource type from browser performance entries and fail if a route exceeds hard budgets.

- [ ] **Step 5: Capture baseline report**

Write JSON output to:

```text
apps/web/test-results/performance/latest.json
```

Do not commit generated reports unless the team decides to track baselines.

- [ ] **Step 6: Verify**

Run:

```bash
pnpm --filter web build
pnpm --filter web test:perf
```

Expected: critical routes stay under initial budgets.

- [ ] **Step 7: Commit**

```bash
git add apps/web
git commit -m "test: add web performance smoke checks"
```

---

## Task 8: Add Accessibility and Interaction Smoke Checks

**Files:**

- Modify: `apps/web/package.json`
- Create: `apps/web/test/static-export/accessibility.test.ts`
- Create: `apps/web/test/static-export/navigation.test.ts`

- [ ] **Step 1: Add accessibility dependency**

Add:

```json
{
  "devDependencies": {
    "@axe-core/playwright": "^4.11.0"
  }
}
```

- [ ] **Step 2: Add exported-page accessibility smoke**

Run axe on every high-value exported page and assert no `critical` or `serious` violations. Start with the same route list as Task 7.

- [ ] **Step 3: Add interaction smoke**

For desktop and mobile viewports, assert:

- navigation menu opens when applicable
- all header links resolve to 200 or valid external URLs
- footer links resolve to 200 or valid external URLs
- locale stripping does not produce `/en` links in the default export

- [ ] **Step 4: Verify**

Run:

```bash
pnpm --filter web build
pnpm --filter web test:static
```

Expected: static export, accessibility smoke, and navigation smoke all pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web pnpm-lock.yaml
git commit -m "test: add accessibility and navigation smoke checks"
```

---

## Task 9: Add CI Workflow

**Files:**

- Create: `.github/workflows/test.yml`

- [ ] **Step 1: Add CI job**

The workflow should run on pull requests and pushes to `develop`:

```yaml
name: Test

on:
  pull_request:
  push:
    branches:
      - develop

jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v5
      - uses: pnpm/action-setup@v5
        with:
          version: 11.1.0
      - uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: pnpm
      - run: CI=true pnpm install --frozen-lockfile
      - run: pnpm --filter web exec playwright install --with-deps chromium
      - run: pnpm test:release
        env:
          PAYLOAD_SECRET: test-secret-at-least-32-characters
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/logos_test
          NEXT_PUBLIC_SERVER_URL: http://localhost:3011
          NEXT_PUBLIC_WEB_URL: http://localhost:3010
```

- [ ] **Step 2: Add Postgres service only if CMS build needs DB connectivity**

If `pnpm --filter cms build` requires a live Postgres connection, add:

```yaml
services:
  postgres:
    image: postgres:17
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: logos_test
    ports:
      - 5432:5432
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

- [ ] **Step 3: Verify locally before opening PR**

Run:

```bash
CI=true pnpm install --frozen-lockfile
pnpm test:release
```

Expected: both pass locally before relying on CI.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "ci: add monorepo test workflow"
```

---

## Rollout Order

1. Land CMS and content unit coverage first because they do not need a browser.
2. Land web route inventory and metadata tests before Playwright.
3. Land static export smoke after `pnpm --filter web build` is stable.
4. Land performance smoke as warning-only, record a baseline, then convert to a hard gate.
5. Land CI last so the final workflow reflects real local commands.

## Completion Definition

The test program is complete when:

- `pnpm test:release` passes from a clean checkout.
- Every repo-backed CMS collection has save, delete, PR reuse, and media coverage where applicable.
- Every exported HTML page in `apps/web/out` loads successfully under Playwright.
- Critical pages have performance budgets and a current baseline report.
- CI runs the same commands documented here.
- Docs in `docs/test` describe how to run, debug, and extend each test layer.
