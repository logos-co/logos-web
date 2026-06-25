# Navbar Pages → CMS Copy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make every navbar page's copy editable via `@repo/content` by migrating it from `messages.pages.*` into `content/pages/en/<route>.json`, byte-identical render.

**Architecture:** Per the proven home/get-started/movement pattern (already on this branch — see commits for `getStartedCopy`/`movementCopy` as the worked template). Each page's prose becomes ONE bespoke typed section (`<route>Copy`) in a new Pages doc; the route loads it via `getPageCopy` + `findSection`, keeps its record/dynamic loaders, passes `data` props; components replace `t('a.b')` → `data.a.b`; metadata switches to `createPageMetadata`; the messages namespace is deleted.

**Tech Stack:** Next.js App Router, next-intl (being removed from these pages' prose), Zod, `@repo/content`, Vitest + `renderToStaticMarkup`, `node:test`.

## Global Constraints

- **Byte-identical render**, verified vs `master`. Only the data SOURCE changes (`t('a.b')`→`data.a.b`). DOM/classes/structure/hrefs unchanged.
- **Verbatim copy** moved from `messages.pages.<ns>` into content (preserve punctuation, dashes, `\n`, indexed order).
- **Metadata parity:** content `title`/`description` = exact current `messages.pages.<ns>.title`/`description`; no `seo` override; switch to `createPageMetadata(route)`.
- **Record/dynamic loaders untouched** (blog articles, podcast episodes, research resources, builders/circle records, etc.). Edits scoped to prose.
- **Indexed copy** (manifesto body/mobileHeading/author/more; rows/items) → arrays/records in content; component reads by index/key.
- **Blog family** (media + podcast + logos-broadcast-network) migrate together so `pages.blog` is fully deletable with no messages↔content dup (content↔content reuse OK).
- Few logical commits; consolidate before updating PR #62. No `Co-Authored-By: Claude`.

## Worked template (reference for every task)

The `getStartedCopy`/`movementCopy` migration on this branch is the exact pattern. For each page:
1. Read `apps/web/messages/en.json` → `pages.<ns>` (full object) and the route's `page.tsx` + components.
2. Add `<route>CopySectionSchema` (`componentType: '<route>Copy'`) to `packages/content/src/schemas/pages.ts` + the `pageSectionSchema` union, mirroring the namespace shape (title/description excluded → PageCopy metadata). Add a `node:test` parse test (mirror `page-dedup-sections.test.ts`).
3. Create `content/pages/en/<route>.json` (PageCopy: schemaVersion 1, language "en", route, title/description = exact messages values, one `<route>Copy` section = the namespace verbatim minus title/description).
4. Refactor `page.tsx`: add `getPageCopy(route, locale)` to its `Promise.all`, drop `getTranslations`/NAMESPACE, `findSection<...>`, pass `data` (+keep record loaders), switch metadata to `createPageMetadata(route)`.
5. Refactor components: `t('a.b')` → `data.a.b` (slices). Client components (`useTranslations`) take a `data`/`copy` prop. Drop translator types.
6. Add a `renderToStaticMarkup` component test asserting migrated copy renders.
7. `pnpm --filter @repo/content validate` + `check-types` + focused web test → green. Commit. (Do NOT delete the messages key yet — final task does that to keep the suite green.)

Routes: use `ROUTES.*` values — book `/book`, brandKit `/brand-kit`, research `/research`, nodeProgramme `/node-programme`, lambdaPrize `/lambda-prize`, manifesto `/manifesto`, media `/media`, podcast `/podcast`, logosBroadcastNetwork `/logos-broadcast-network`. Confirm each in `apps/web/constants/routes.ts`.

---

## Task 1: book → content
namespace `pages.book` (title, description, heading). Component: `app/[locale]/book/page.tsx` (and farewell-to-westphalia view if shared — verify). Section `bookCopy` key `book.copy` = `{ heading }`. Follow the template. Commit `feat(web): source book page copy from content`.

## Task 2: brand-kit → content
namespace `pages.brandKit` (title, description, heading, intro, downloads{brandMarksLabel, brandMarksHref, guidelinesSection, guidelinesLabel, guidelinesHref}). Renders via `DocsPageShell`. Section `brandKitCopy` key `brandKit.copy`. Note `downloads` includes hrefs — keep them verbatim. Commit `feat(web): source brand-kit page copy from content`.

## Task 3: research → content
namespace `pages.research` (heading, hero{kicker,title,description,ctas}, overview{title,body,cta}, resources{title,learnMore,items}, contribute{title,copy}). Component `components/sections/research/research-page.tsx`. `ctas`/`items` → arrays. Section `researchCopy` key `research.copy`. Commit `feat(web): source research page copy from content`.

## Task 4: node-programme → content
namespace `pages.nodeProgramme` (heading, hero, builders, stack{title,titleMuted,items}, useCases{title,titleMuted,items}, signup{…,roles}). The signup form is a CLIENT component (`useTranslations('pages.nodeProgramme.signup')`) — pass `copy={data.signup}` prop and replace its `t()` reads. `items`/`roles` → arrays. Section `nodeProgrammeCopy` key `nodeProgramme.copy`. Commit `feat(web): source node-programme page copy from content`.

## Task 5: lambda-prize → content
namespace `pages.lambdaPrize` (hero, howItWorks{rows}, evaluation{rows}, featured{prizes}, about{rows}, techStack{startBuildingCta,docsCta}, support{rows}). It also uses `getHomeTechStackOverview` (content) for the embedded stack — leave that untouched. `rows`/`prizes` → arrays. Section `lambdaPrizeCopy` key `lambdaPrize.copy`. Commit `feat(web): source lambda-prize page copy from content`.

## Task 6: manifesto → content
namespace `pages.manifesto` (heading, headingLine1/2, mobileHeading[0..4], author[0..3], abstractHeading, abstractBody, keywordsHeading, keywords, body[0..28], moreHeading, more[0..2]). Numbered objects → string ARRAYS in order (mobileHeading, author, body, more). Component `app/[locale]/manifesto/page.tsx`. Section `manifestoCopy` key `manifesto.copy`. Verify the 29 body paragraphs render in identical order. Commit `feat(web): source manifesto page copy from content`.

## Task 7: blog family (media + podcast + logos-broadcast-network) → content
- `pages.blog` (media: title, description, hero{line1,line2,tagline}, nav{label,articles,podcasts,broadcast}, articles{…}, podcasts{…}, broadcast{…}) → `content/pages/en/media.json` `mediaCopy` key `media.copy`.
- `pages.podcast` (+ shared `pages.blog.podcasts`) → `content/pages/en/podcast.json` `podcastCopy` key `podcast.copy`. The podcasts sub-copy that podcast renders comes from content now (content↔content reuse with media is allowed).
- `pages.logosBroadcastNetwork` → `content/pages/en/logos-broadcast-network.json` `broadcastCopy` key `logosBroadcastNetwork.copy`.
Refactor all three routes + their components/shared blog components (`media/page.tsx`, `podcast/page.tsx`, `logos-broadcast-network/page.tsx`). Keep blog/podcast/episode record loaders untouched. After this task, `pages.blog`, `pages.podcast`, `pages.logosBroadcastNetwork` are no longer read (deleted in Task 9). Commit `feat(web): source media/podcast/broadcast copy from content`.

## Task 8: technology-stack stack-explorer residual
`components/sections/shared/tech-stack-explorer.tsx` reads `pages.technologyStack.stack`. Move the `.stack` labels into the existing `content/pages/en/technology-stack.json` (extend its `techStackOverview` section or add a sibling field), pass them as a prop to `tech-stack-explorer`, and replace its `t()` reads. Verify NO other consumer of `pages.technologyStack` remains; if `.stack` was the only key, the whole `pages.technologyStack` namespace becomes deletable (Task 9), else remove only `.stack`. Commit `refactor(web): source tech-stack explorer labels from content`.

## Task 9: delete migrated namespaces, guards, contracts, verify
**Files:** `apps/web/messages/en.json`; `content-route-contracts.test.ts`; `messages-no-home-copy.test.ts`.
- Add contract entries for each new route (sections present + metadata from PageCopy SEO).
- Extend the ownership guard: `messages.pages` lacks `book, brandKit, research, nodeProgramme, lambdaPrize, manifesto, blog, podcast, logosBroadcastNetwork` (and `technologyStack` if fully removed).
- Delete those namespaces from `messages/en.json`. Keep `common`, `connectForm`, `locale`, and any not-yet-migrated namespace.
- Grep zero live reads: `grep -rnE "pages\.(book|brandKit|research|nodeProgramme|lambdaPrize|manifesto|blog|podcast|logosBroadcastNetwork)" apps/web --include=*.ts --include=*.tsx | grep -v __tests__` → none.
- Full gauntlet: `@repo/content` validate + test; web check-types; web test; `web build` (all navbar routes build).
- **Byte-identical proof vs master** for each migrated page's rendered copy; cross-store dedup scan → migrated namespaces gone, remaining overlaps = accepted shared chrome.
Commit `chore(web): drop migrated navbar page namespaces from messages; guards + contracts`.

---

## Self-Review

**Spec coverage:** §3 inventory → Tasks 1–8 (one per page/group + explorer); §4 target → all tasks; §5 model → template + per-task; §6 tests → per-task + Task 9; blog-family special case → Task 7; metadata parity → template + Task 9 contracts. §7 risks addressed (blog family Task 7; indexed copy Tasks 5/6; client signup Task 4; explorer Task 8).

**Placeholder scan:** content payloads are "verbatim from messages.pages.<ns>" (data move, grep-guarded in Task 9); schema shapes derived per page from the §3 structures; the worked template gives the concrete recipe with in-repo examples (getStartedCopy/movementCopy). Implementers read the actual messages + components, as in the prior (successful) workstreams.

**Type consistency:** each `<route>Copy` literal + `<Route>CopySection` type used in its task's schema, content key (`<route>.copy`), findSection, and Task 9 contracts/guard.

> **Pre-flight for implementers:** read each page's current messages object + components to map `t('…')` → `data.…` exactly; preserve DOM/classes/hrefs and record/dynamic loader calls; keep messages keys until Task 9.
