# Navbar Pages → CMS Copy (Design Spec)

- **Date:** 2026-06-25
- **Branch:** `refactor/page-copy-single-source` (same branch as home/get-started/movement)
- **Status:** Approved (user: make all navbar pages CMS-editable; proceed in one branch)
- **Follows:** the home and get-started/movement migrations on this branch. Identical ownership contract, content-model, and render-invariance discipline.

---

## 1. Goal

Every page reachable from the navbar must have its copy editable through `@repo/content` (CMS), not next-intl `messages`. Audit found these navbar pages still source copy from `messages.pages.*` (or its NAMESPACE-const form), so they are NOT CMS-editable yet:

`book`, `brand-kit`, `research`, `node-programme`, `lambda-prize`, `manifesto`, `media` (via `pages.blog`), plus the `technology-stack` interactive **stack explorer** (residual `pages.technologyStack.stack`).

Because `pages.blog` is shared by `media` (navbar) and the non-navbar `podcast`/`logos-broadcast-network` pages, the blog family must migrate together to avoid creating new cross-store duplication.

Already CMS (no work): home, get-started, movement, basecamp, technology-stack page body (+ blockchain/messaging/networking/storage), builders-hub (+rfps/ideas, via content records), circles (records).

---

## 2. Decisions (locked — inherit from prior specs)

1. **Each page's prose → one bespoke typed section** (`<page>Copy`) in `content/pages/en/<route>.json` (Pages doc, `pageCopySchema`), read via `getPageCopy` + `findSection`. Mirrors get-started/movement.
2. **Verbatim copy**, byte-identical render, verified vs `master`. `t('a.b')` → `data.a.b`; DOM/classes/structure/hrefs unchanged.
3. **Metadata** switches from `createTranslatedPageMetadata({namespace})` to content-based `createPageMetadata(route)`; content `title`/`description` = exact current messages values (no `seo` override) → identical metadata.
4. **Delete** the migrated `messages.pages.<key>` namespaces. Keep shared chrome (`common`, `connectForm`, `locale`) and not-yet-migrated namespaces intact.
5. **Blog family** (`media` + `podcast` + `logos-broadcast-network`) migrate together: one content doc per route, but the shared `pages.blog.podcasts` copy must end up in exactly one store. Approach: each route gets its own content doc with the copy it renders; where media and podcast render the SAME podcasts strings, both read from content (content↔content reuse is allowed) and `pages.blog`/`pages.podcast`/`pages.logosBroadcastNetwork` are fully deleted.
6. **Indexed/numbered copy** (e.g. manifesto `body.0..28`, `mobileHeading.0..4`): model as string arrays in content; component reads by index — same render.
7. Few logical commits; consolidate before updating PR #62. No `Co-Authored-By: Claude`.

Out of scope: hardcoded-JSX pages not in messages (activist-builder, coalition-partner, contact, security, ukdebt, legal pages, etc.) — they have no messages copy to dedup and are not required by the navbar-CMS directive; flagged separately. Accepted shared chrome labels/URLs unchanged.

---

## 3. Per-page inventory (verified 2026-06-25)

All routes read via `getTranslations({namespace})` (server) or a NAMESPACE const, then thread `t`/props into components. Record/dynamic data (blog articles, podcast episodes, research resources, etc.) stays on its existing loaders.

| Route | messages namespace | Prose shape (top keys) | Size |
|---|---|---|---|
| book | `pages.book` | title, description, heading | trivial |
| brand-kit | `pages.brandKit` | title, description, heading, intro, downloads{…} | small |
| research | `pages.research` | title, description, heading, hero{kicker,title,description,ctas}, overview{title,body,cta}, resources{title,learnMore,items}, contribute{title,copy} | moderate |
| node-programme | `pages.nodeProgramme` | title, description, heading, hero, builders, stack{title,titleMuted,items}, useCases{…,items}, signup{form labels, roles} | moderate (signup form is client `useTranslations('pages.nodeProgramme.signup')`) |
| lambda-prize | `pages.lambdaPrize` | title, description, hero, howItWorks{rows}, evaluation{rows}, featured{prizes}, about{rows}, techStack{startBuildingCta,docsCta}, support{rows} | large |
| manifesto | `pages.manifesto` | title, description, heading(s), mobileHeading[5], author[4], abstractHeading/Body, keywordsHeading, keywords, body[29], moreHeading, more[3] | large (indexed) |
| media | `pages.blog` | title, description, hero{line1,line2,tagline}, nav{label,articles,podcasts,broadcast}, articles{…}, podcasts{…}, broadcast{…} | moderate (blog family) |
| podcast | `pages.podcast` + `pages.blog.podcasts` | own podcast copy + shared podcasts subkey | moderate (blog family) |
| logos-broadcast-network | `pages.logosBroadcastNetwork` | broadcast page copy | moderate (blog family) |
| technology-stack (explorer) | `pages.technologyStack.stack` | interactive stack explorer labels (in `components/sections/shared/tech-stack-explorer.tsx`) | residual; page body already CMS |

---

## 4. Target State

1. New `content/pages/en/<route>.json` for: book, brand-kit, research, node-programme, lambda-prize, manifesto, media, podcast, logos-broadcast-network. Each holds the page's prose as a `<route>Copy` section (verbatim).
2. The technology-stack explorer labels (`pages.technologyStack.stack`) move into the existing `content/pages/en/technology-stack.json` (extend its section or add a sibling), and `tech-stack-explorer.tsx` reads them from props/content.
3. Each route resolves prose via `getPageCopy` + `findSection`, keeps its record/dynamic loaders, uses content-based metadata, and no longer calls `getTranslations`/`useTranslations` for prose.
4. `messages.pages.{book,brandKit,research,nodeProgramme,lambdaPrize,manifesto,blog,podcast,logosBroadcastNetwork,technologyStack}` removed (technologyStack only if fully unused after the explorer move — verify; it may retain non-stack keys, in which case remove only `.stack`).
5. Schemas for the new sections validate via `validate.ts` and are in the `pageSectionSchema` union.
6. Site-wide scan: navbar pages have zero cross-store copy; remaining overlaps = accepted shared chrome.

---

## 5. Content Model & Component Refactor

Same as get-started/movement: one bespoke `<route>CopySection` per page (shape mirrors the messages namespace, minus title/description which become PageCopy metadata fields), added to `pageSectionSchema`. Components replace `t('a.b')` with `data.a.b` (slices passed down). Indexed groups (manifesto body, mobileHeading, author, more; research ctas; rows/items) become arrays/records in content. Client components that use `useTranslations` (node-programme signup) take a `data`/`copy` prop instead.

Blog family: create `media.json`, `podcast.json`, `logos-broadcast-network.json`. The podcasts strings media and podcast both render are duplicated across the two CONTENT docs (content↔content reuse, allowed) — OR factored into a shared section if cleaner; implementer's call, but `pages.blog` must end fully deleted with no messages↔content dup.

---

## 6. Tests / Verification (per prior pattern)

- New section schema unit tests; `validate.ts` validates all new Pages docs.
- `renderToStaticMarkup` component tests asserting migrated copy renders.
- Contract test entries for each new route (sections present + metadata from PageCopy SEO).
- Ownership guard extended: `messages.pages` lacks the migrated keys.
- **Byte-identical proof vs master** for each migrated page's rendered copy.
- Full gauntlet: `@repo/content` validate + test; web check-types; web test; `web build` (all migrated routes build).
- Cross-store dedup scan: migrated namespaces gone; remaining overlaps = accepted shared chrome.

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Blog family shared `pages.blog.podcasts` | Migrate media+podcast+broadcast together; ensure `pages.blog` fully deleted with no messages↔content dup (content↔content reuse OK). |
| manifesto/lambda-prize large indexed copy | Model arrays/records; per-section byte comparison vs master; component reads by index. |
| node-programme client signup form (`useTranslations`) | Pass copy as a prop to the client form; keep dynamic submit behavior. |
| tech-stack explorer is a shared component | Move `.stack` labels into technology-stack content; pass as props; verify only the explorer consumed `pages.technologyStack.stack`. |
| Metadata regression | content title/description = exact old values; contract test asserts metadata. |
| Record/dynamic loaders | Untouched; edits scoped to prose. |
| Large PR | Few logical commits; consolidate; update PR #62 description at the end. |

---

## 8. Commit Plan

Logical commits, consolidated before PR update:
1. `feat(content): add navbar page section schemas + Pages docs`
2. `refactor(web): source navbar pages copy from content; content-based metadata`
3. `chore(web): drop migrated pages.* namespaces from messages; guards + contracts`

(Or split per page-group if diffs are large; keep app green at each step — content first, wiring next, messages deletion last.)

---

## 9. Verification Plan

Same as §6, run at the end across all migrated pages; document remaining accepted overlaps; confirm `web build` renders every navbar route; then consolidate commits and propose an updated PR #62 description.
