# Logos — SEO Checklist

Living checklist for all SEO work on logos.co. Status keys: ✅ done · ⏳ in progress · ❌ not done · ⚠️ needs fix.

---

## 0. Current baseline audit

| Asset                                                           | Status | Notes                                                                                                                            |
| --------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/utils/metadata.ts` — `createDefaultMetadata()` helper | ✅     | OG, Twitter, canonical, alternates, keywords, robots                                                                             |
| `apps/web/app/[locale]/robots.ts`                               | ✅     | Allow-all + sitemap ref                                                                                                          |
| `apps/web/app/sitemap.ts`                                       | ⚠️     | Only contains the root `/` — all canonical English pages still missing                                                           |
| `apps/web/data/siteConfig.ts`                                   | ⚠️     | Title + description are template placeholders — replace with real copy                                                           |
| `apps/web/app/og/route.tsx`                                     | ⚠️     | Has hardcoded "Logos Next Tailwind Template" fallback — update                                                                   |
| `apps/web/app/[locale]/not-found.tsx`                           | ⚠️     | No `<title>` or metadata                                                                                                         |
| `apps/web/i18n/routing.ts`                                      | ⚠️     | Should be simplified to English-only routing                                                                                     |
| Twitter card metadata uses `_title` / `_description`            | ❌     | **Bug at `utils/metadata.ts:60-61`** — uses empty `title` / `description` args instead of the resolved `_title` / `_description` |
| `alternates.languages`                                          | ✅     | English-only site; no alternate language URLs required                                                                           |
| `metadataBase` + canonical per page                             | ✅     | Helper wires these correctly when called                                                                                         |
| Favicon / apple-touch-icon                                      | ✅     | `apps/web/app/[locale]/layout.tsx:24-25`                                                                                         |

**Fix immediately (blocking):**

1. `siteConfig.ts` — set real `title`, `description`, `keywords`
2. `utils/metadata.ts` — use `_title` / `_description` in `twitter` block
3. `i18n/routing.ts` — simplify routing to English-only behavior
4. `sitemap.ts` — generate entries for every canonical English page
5. `og/route.tsx` — remove template placeholder copy

---

## 1. Technical SEO

### Metadata

- [ ] Every page (`app/[locale]/**/page.tsx`) exports `generateMetadata()` using `createDefaultMetadata()`
- [ ] Each page passes a unique `title` (50–60 chars, keyword near front, brand suffix)
- [ ] Each page passes a unique `description` (140–160 chars, includes primary keyword)
- [ ] Each page passes a unique `path` so canonical + OG URL are correct
- [ ] Enabled dynamic routes generate metadata per param
- [ ] `404` (`not-found.tsx`) sets `title: '404 — Page not found'` and `robots: { index: false }`

### Canonical URLs

- [ ] Every page resolves to exactly one canonical URL via `alternates.canonical`
- [ ] No trailing slash drift (`next.config.mjs` has `trailingSlash: false` ✅)
- [ ] Duplicate-content risks: query-param variants (e.g. `?view=grid`) set `canonical` to the base path

### robots.txt / robots meta

- [x] `/robots.txt` allows all user agents (currently set)
- [ ] `robots.index` is tied to `NODE_ENV` / `NEXT_PUBLIC_API_MODE` — confirm staging blocks indexing
- [ ] Staging domain returns `X-Robots-Tag: noindex` header (via middleware or `next.config.mjs`)
- [ ] `/admin`, `/api`, `/_next` paths are disallowed where appropriate

### Sitemap

- [ ] `sitemap.xml` includes the currently enabled public pages from [web-pages.md](web-pages.md)
- [ ] Dynamic entries: `/builders-hub/ideas/[id]`, `/builders-hub/rfps/[id]`; article pages live on `press.logos.co`
- [ ] Keep `/about` and `/circles/[slug]` out of sitemap while their route availability flags are disabled.
- [ ] Each entry includes `lastModified`, `changeFrequency`, `priority`
- [ ] One entry per canonical English path
- [ ] Sitemap submitted to Google Search Console + Bing Webmaster Tools

### Structured data (JSON-LD)

- [ ] `Organization` schema on every page (name, url, logo, sameAs social URLs)
- [ ] `WebSite` schema with `SearchAction` on the homepage
- [ ] `BreadcrumbList` on every non-home page
- [ ] `CollectionPage` on `/press`; individual `Article` JSON-LD is owned by `press.logos.co`
- [ ] `FAQPage` on `/faq` with all Q/A pairs
- [ ] `Event` on `/circles` upcoming-event cards
- [ ] All JSON-LD rendered as `<script type="application/ld+json">` in the page `<head>`

---

## 2. Content SEO

### Heading hierarchy

- [ ] Exactly one `<h1>` per page (the page title or hero headline)
- [ ] `<h2>` for each major section, `<h3>` for sub-sections
- [ ] No heading-level skipping
- [ ] Headings contain the target keyword naturally

### Page title + description targeting

| Page          | Primary keyword                      | Working title                                                      |
| ------------- | ------------------------------------ | ------------------------------------------------------------------ |
| Homepage      | Logos / decentralized infrastructure | "Logos — Pioneering a New Era of Freedom"                          |
| Tech Overview | logos technology stack               | "The Logos Technology Stack — Privacy-First Infrastructure"        |
| Blockchain    | privacy blockchain                   | "Blockchain — Privacy as Infrastructure \| Logos"                  |
| Networking    | decentralized networking             | "Networking Stack — Privacy-First Networking \| Logos"             |
| Messaging     | decentralized messaging              | "Logos Messaging — Secure, Private Messaging"                      |
| Storage       | decentralized storage                | "Storage — Private, Secure, Decentralized Storage \| Logos"        |
| Builders Hub  | web3 builders / bounties             | "Builders Hub — Build on Logos"                                    |
| Ideas         | community ideas                      | "Ideas — Logos Community Submissions"                              |
| RFPs          | web3 bounties                        | "RFPs — Fund Your Build on Logos"                                  |
| Circles       | logos circles / local chapters       | "Logos Circles — Find Your Local Chapter"                          |
| Press         | logos news                           | "The Logos Press Engine"                                           |
| FAQ           | —                                    | "FAQ \| Logos" (set `robots.index: true` but low priority)         |
| Terms         | —                                    | "Terms & Conditions \| Logos" (set `robots.index: false` optional) |

### Content quality

- [ ] Primary keyword in first 100 words
- [ ] Related keywords used naturally (no stuffing)
- [ ] Internal links use descriptive anchor text — never "click here"
- [ ] External links to authoritative sources open in new tab with `rel="noopener noreferrer"`
- [ ] Alt text on every image (empty `alt=""` only for purely decorative images)
- [ ] Every image has explicit `width` + `height` (avoid CLS)

---

## 3. Language and Routing

Routing is English-only. There should be no public `/fr/*` or `/ko/*` routes.

- [ ] `i18n/routing.ts` exposes only `en`, or the i18n wrapper is removed if no longer needed.
- [ ] `createDefaultMetadata` emits canonical URLs only; no alternate language URLs are required.
- [ ] Locale switcher UI is removed or hidden.
- [ ] Page titles, descriptions, and OG copy come from English content files.
- [ ] Sitemap entries include canonical English URLs only.

---

## 4. Open Graph / Twitter

- [ ] `og:image` is 1200 × 630 with brand typography (Logos wordmark + headline)
- [ ] Dynamic OG endpoint (`/og?title=...&description=...`) is wired from each page's metadata — currently all pages share `/og` (generic). Update to pass per-page title/description.
- [ ] `og:type: website` on listing pages; individual article previews are owned by `press.logos.co`
- [ ] Twitter card: `summary_large_image`, `twitter:site`, `twitter:creator` set
- [ ] Preview validated via [Twitter card validator](https://cards-dev.twitter.com/validator), [LinkedIn post inspector](https://www.linkedin.com/post-inspector/), [Facebook sharing debugger](https://developers.facebook.com/tools/debug/)

---

## 5. Performance / Core Web Vitals

Targets: **LCP ≤ 2.5 s · INP ≤ 200 ms · CLS ≤ 0.1** (75th percentile, mobile).

### Images

- [ ] Use `next/image` everywhere (never `<img>` except in SVG sprites)
- [ ] Above-the-fold hero image: `priority` + `fetchPriority="high"`
- [ ] Below-the-fold: `loading="lazy"` (default)
- [ ] Serve AVIF / WebP via Next's built-in optimization (confirm `images.unoptimized` is `false` in prod)
- [ ] Responsive `sizes` attribute on every `<Image>` (avoid shipping desktop-sized images to mobile)
- [ ] Provide explicit `width` × `height` to prevent CLS

### Fonts

- [x] `next/font` for Rhymes Display / Public Sans / Fira Code (`apps/web/app/fonts.ts`)
- [ ] All critical fonts use `display: 'swap'` (next/font default ✅)
- [ ] Font variants subset to used weights / styles
- [ ] No `@import` fonts in CSS (blocking)

### JavaScript

- [ ] Client components marked `'use client'` only where necessary
- [ ] `motion` / interactive code lazy-loaded via `next/dynamic` where safe
- [ ] Bundle analyser run; each route chunk < 100 KB gzipped (target)
- [ ] No unused `@acid-info/logos-ui` primitives in the final bundle (tree-shaken)

### Rendering

- [ ] Static pages use RSC + `generateStaticParams` where possible (Press, FAQ, Ts&Cs, tech pages)
- [ ] Dynamic pages use ISR where content changes daily (Circles, Ideas, RFPs)
- [ ] `generateMetadata` runs on the server
- [ ] Prefetching: Next `<Link>` default prefetch is ON for above-the-fold nav

### Animations

- [x] Motion variants respect `prefers-reduced-motion` (`motion` library handles automatically)
- [ ] Animations use `transform` / `opacity` only — never animate layout properties
- [ ] Scroll-linked animations (`useScroll`) are throttled / GPU-accelerated

---

## 6. Accessibility (indirect SEO signal)

- [ ] Every interactive element has an accessible name (label or `aria-label`)
- [ ] Colour contrast ≥ 4.5:1 for body, 3:1 for large text (brand-dark-green on brand-off-white passes)
- [ ] Focus states visible (`outline` token set in `tailwind.css` ✅)
- [ ] `lang` attr on `<html>` matches active locale ✅
- [ ] Skip-to-content link in nav
- [ ] All forms have labels; errors use `aria-describedby`
- [ ] Keyboard navigation verified on all interactive components (nav overlay, accordion, grid/list toggle, map)

---

## 7. Page-specific SEO requirements

For each page in [pages.md](pages.md), ensure:

1. `generateMetadata()` is defined with unique title / description / path
2. One `<h1>` matching the page title
3. Hero image has `priority` loading
4. Internal links to relevant related pages
5. JSON-LD per table below

| Page                           | JSON-LD type                         | Breadcrumb                     | Priority in sitemap |
| ------------------------------ | ------------------------------------ | ------------------------------ | ------------------- |
| `/`                            | `Organization` + `WebSite`           | —                              | 1.0                 |
| `/technology-stack`            | `WebPage`                            | Home → Tech Stack              | 0.9                 |
| `/technology-stack/blockchain` | `TechArticle`                        | Home → Tech Stack → Blockchain | 0.8                 |
| `/technology-stack/networking` | `TechArticle`                        | Home → Tech Stack → Networking | 0.8                 |
| `/technology-stack/messaging`  | `TechArticle`                        | Home → Tech Stack → Messaging  | 0.8                 |
| `/technology-stack/storage`    | `TechArticle`                        | Home → Tech Stack → Storage    | 0.8                 |
| `/builders-hub`                | `WebPage` + `ItemList`               | Home → Builders Hub            | 0.9                 |
| `/builders-hub/ideas`          | `ItemList`                           | Home → Builders Hub → Ideas    | 0.8                 |
| `/builders-hub/rfps`           | `ItemList`                           | Home → Builders Hub → RFPs     | 0.8                 |
| `/circles`                     | `ItemList` (locations)               | Home → Circles                 | 0.9                 |
| `/press`                       | `CollectionPage`                     | Home → Press                   | 0.7                 |
| `/faq`                         | `FAQPage`                            | Home → FAQ                     | 0.5                 |
| `/terms-and-conditions`        | —                                    | Home → Terms                   | 0.3                 |

---

## 8. Monitoring & measurement

- [ ] Google Search Console verified for `logos.co`
- [ ] Bing Webmaster Tools verified
- [ ] Sitemap submitted to both
- [ ] Google Analytics 4 / Plausible installed with cookie-less events
- [ ] Core Web Vitals tracked (via `web-vitals` lib or Vercel Analytics)
- [ ] Lighthouse CI runs on every PR (target: Perf 90+, Accessibility 100, SEO 100, Best Practices 100)
- [ ] 404 / 5xx error rates monitored (Sentry or logs)
- [ ] Referring domains + backlinks tracked (Ahrefs / SEMrush / Search Console Links report)
- [ ] Indexing coverage reviewed monthly in Search Console
- [ ] Rich results validated via [Google Rich Results Test](https://search.google.com/test/rich-results)

---

## 9. Launch checklist

Before flipping DNS to production:

- [ ] All items in §0 are ✅
- [ ] Every page in [pages.md](pages.md) has `generateMetadata` + one `<h1>`
- [ ] Sitemap contains every canonical English URL
- [ ] `robots.ts` allows indexing in prod, blocks in staging
- [ ] Staging is on a `noindex` subdomain (e.g. `staging.logos.co` with `X-Robots-Tag: noindex`)
- [ ] OG images render correctly for 5 representative pages
- [ ] Social-share previews validated on Twitter / LinkedIn / Facebook
- [ ] JSON-LD validates for homepage, a tech page, `/press`, and the FAQ
- [ ] Lighthouse passes on homepage (Perf 90+, A11y 100, SEO 100)
- [ ] Redirect rules: `www.logos.co` → `logos.co` (or reverse), trailing-slash enforcement, legacy path redirects
- [ ] 404 page renders + has correct metadata
- [ ] `sitemap.xml` and `robots.txt` return 200 at their canonical URLs

---

## 10. Content backlog (ongoing)

- [ ] Publish 1–2 technical articles per month on the Press Engine
- [ ] Update existing tech pages quarterly with new content (pings search engines via sitemap `lastModified`)
- [ ] Case studies for each RFP winner and Idea implementation
- [ ] Backlink outreach: crypto / privacy / open-source media, dev communities
- [ ] Answer target questions on Stack Overflow / Reddit / HN with a link to the relevant Logos page (where appropriate)
- [ ] Glossary page (`/glossary`) for terms: zk-SNARKs, DA, mix-net, etc.
