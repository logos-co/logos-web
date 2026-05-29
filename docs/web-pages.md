# Logos — Pages Implementation Reference

All pages are **responsive** (mobile-first, 393 px → 1440 px breakpoint) and must **strictly follow Figma** including animations and motion. Every page shares `<SiteHeader />` and `<Footer />`.

Figma file key: `qpsaED5iVKrOXoxwCWXuN3`
All nodes live in the `_Dev Handoff: All Pages` page (`2267:46449`).

---

## Shared conventions

- Nav bar is `fixed top-0 z-50`, 40 px tall — all pages need `pt-10` on the first section so content is not clipped.
- All pages use `bg-brand-off-white` as the default background.
- Inter-section spacing matches Figma exactly; do not add or remove padding.
- `text-h1` links in the nav overlay animate in on open (staggered fade-up, see Nav section).
- "Related Articles" and "Explore the Tech Stack" sections are **shared modules** — implement once and reuse.

---

## 1. Homepage

**Route:** `/`
**Figma section:** `40009046:22441`
**Desktop frame:** `40009046:22699` — 1440 × 12728
**Mobile frame:** `40009046:22442` — 393 × 12711

**Prototype / motion references:**

- `40009046:23208` — ATF hero at viewport (800 px): headline + card **peeking** up from the bottom edge with rounded top corners visible. Invites scroll.
- `40009046:22710` — Desktop Build / Node / Circles triptych (1440 × 1363): 3 large rounded-xl cards, photo backgrounds, `Lambda icon Title` + description + CTA on the left, numbered examples table on the right.
- `40009046:22453` — Mobile Build / Node / Circles (393 × 1363): same 3 cards stacked, tables collapsed, just title + description + CTA visible.

**Animation library:** `motion` (v12 — modern framer-motion). Shared variants live in [`apps/web/lib/motion.ts`](../apps/web/lib/motion.ts); helpers in [`apps/web/components/motion/`](../apps/web/components/motion/).

### Sections (top → bottom)

1. **ATF hero** — "Pioneering a New Era of Freedom" display headline (`text-hero`), eyebrow + 2-line body copy, `JOIN THE MOVEMENT →` + `LEARN MORE →` CTAs. Full-bleed aerial photograph background, dark overlay. The top edge of the Build card **peeks up from the bottom** of the viewport (≈ 60 px visible) as a scroll affordance.
2. **Build / Node Programme / Circles triptych** — 3 full-bleed rounded cards (desktop: side-by-side stacked vertically / mobile: stacked). Each card: `Lambda icon Title` serif + description + CTA (left); numbered label `01 BUILD / EXAMPLES` + 4-row examples table (right, desktop only). See nodes `22710` / `22453`.
3. **About teaser** — left-aligned copy block + editorial image, light section.
4. **Tech Stack overview** — "The Logos Technology Stack" serif heading + 4 tech-pillar `<Card>` components (Storage, Messaging, Blockchain, Live Modules).
5. **Use Cases** — horizontal card row: content scrolls or wraps on mobile.
6. **App Install banner** — `<GiantSwitch>` (`accent="grey"`, `imagePosition="left"`).
7. **Builder Portal module** — dark-green full-bleed section with CTA.
8. **Large editorial image** — full-width bleed photograph with overlay quote.
9. **Use Cases repeat / Featured** — carousel or static row.
10. **Press section** — "Press" heading + `SEE ALL →` + 4 thumbnail cards.
11. **Circles teaser** — world map preview + "Circles and Counting" stat.
12. **Footer**

### Motion spec (framer-motion / `motion`)

| Element                     | Pattern                                                 | Variant                                                 | Trigger                                  |
| --------------------------- | ------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------- |
| Hero headline "Pioneering…" | word-by-word fade-up, 60 ms stagger                     | `<AnimatedHeading>` (uses `wordStagger` + `heroFadeUp`) | on mount                                 |
| Hero eyebrow / body / CTAs  | 80 ms stagger fade-up                                   | `stagger` parent + `fadeUp` children                    | on mount, after headline (`delay: 0.6s`) |
| Hero background image       | 1.2 s fade + subtle scale 1.05 → 1                      | `fadeIn` + `scale` on `motion.img`                      | on mount                                 |
| Build card peek             | scroll-linked translateY: 60 → 0 px as hero scrolls out | `useScroll` + `useTransform` on the first card wrapper  | scroll                                   |
| Each B/N/C card             | fade + translateY 40 → 0                                | `heroFadeUp`                                            | `whileInView`, `VIEWPORT_TALL` (15 %)    |
| Card examples table rows    | 80 ms stagger fade-up                                   | `stagger` + `fadeUp`                                    | `whileInView` on the card                |
| Tech-stack pillar cards     | scale-in 0.95 → 1 + fade, 100 ms stagger L→R            | `scaleIn` inside `stagger` parent                       | `whileInView`, `VIEWPORT_ONCE`           |
| Press thumbnails            | fade-up, 80 ms stagger                                  | `stagger` + `fadeUp`                                    | `whileInView`, `VIEWPORT_ONCE`           |
| Footer                      | fade-up only                                            | `fadeUp`                                                | `whileInView`                            |

Respect `prefers-reduced-motion`: all `motion` components auto-degrade to instant transitions when the OS setting is on — no extra code needed.

### Notes

- Hero background image sits behind the nav bar — `<SiteHeader>` text must be off-white on this page. Pass a `theme="dark"` prop (to be added) or set CSS `color-scheme` on the section.
- The "card peek" effect on node `23208` is a scroll-linked animation, **not** a `whileInView` reveal — it needs `useScroll({ target: heroRef, offset: ['start start', 'end start'] })` so the card's y-offset maps to the hero's scroll progress.
- Examples tables inside Build / Node / Circles cards are desktop-only; mobile shows only the header + description + CTA.

---

## 2. Technology Stack Overview

**Route:** `/technology-stack`
**Figma section:** `40009046:20737`
**Desktop frame:** `40009046:20804` — 1440 × 5800
**Mobile frame:** `40009046:20738` — 393 × 5130

1. **Hero** — "The Logos Technology Stack" centered serif heading + body copy.
2. **Four pillars** — grid of 4 `<Card>` components: Storage, Messaging, Blockchain, Live Modules. Each links to its respective tech sub-page.
3. **The Networking Stack / Discovery, Routing, and Mix-Net** — two-line text block (description rows).
4. **The Foundation: Logos Kernel** — single-line text block.
5. **App Install banner** — `<GiantSwitch>` (same as homepage).
6. **Large circle hero image** — circular-masked full-bleed photograph (large `border-radius: 50%` or `rounded-full`).
7. **Use Cases** — horizontal scrollable card row.
8. **Footer**

- Page hero fades in on load.
- Pillar cards stagger in on scroll (left → right, 100 ms apart).
- Circle image: subtle scale-up on scroll enter (`scale: 0.95 → 1`).

- The circular image is a design centrepiece — use `aspect-square overflow-hidden rounded-full`.
- On mobile the 4-pillar grid becomes 2 × 2.

---

## 2a. Basecamp

**Route:** `/basecamp`
**Figma frame:** `146:15527` — 1440 × 4060

1. **Page header** — `← Technology Stack`, `Lambda icon Basecamp`, overview copy, local-first bullets, current-status blocks, install/read-more CTAs.
2. **How Basecamp Works** — three numbered rows beside the large field image.
3. **Local First** — two-column grey panel with image left and explanatory copy right.
4. **Modular by design** — left title with body copy in the right column.
5. **Capabilities** — six grey cards for Wallet, Private Messaging, Blockchain Explorer, File Sharing, Node Dashboard, and Package Manager.
6. **Docs / Builder Hub / Install 3-up** — bordered documentation card, circular Builder Hub image card, and rounded install card.

- Source copy lives in `content/pages/en/basecamp.json`.
- Basecamp cards elsewhere should link to `/basecamp`, not the old `/technology-stack#logos-app` anchor.

---

## 3. Blockchain

**Route:** `/technology-stack/blockchain`
**Figma section:** `40009046:21013`
**Desktop frame:** `40009046:21116` — 1440 × 4986
**Mobile frame:** `40009046:21014` — 393 × 5892

1. **Breadcrumb** — `← Technology Stack` link.
2. **Page header** — `Lambda icon Blockchain` display title + description copy + `LEARN MORE →` CTA.
3. **Hero split** — left: text + `GET THE APP →` button; right: full-bleed tall photograph. On mobile: stacked.
4. **Feature highlight** — "Privacy as infrastructure" + body copy + photo (split layout, reversed).
5. **Cryptarchies** — text block with `CardInfo`-style label + description.
6. **Three-card row** — Dero, Logos Builder Hub (center dark card), Logos App. Center card uses `<Card forceHover>`.
7. **Explore the Logos Technology Stack** — 4 sibling tech cards (same `<Card>` grid, current page excluded or marked active).
8. **The Networking Stack** + **The Foundation: Logos Kernel** — same text rows as Tech Overview.
9. **Related Articles** — `RELATED ARTICLES →` heading + 4 press thumbnail cards in a row.
10. **Footer**

- Hero image: parallax scroll (image moves at ~0.5× scroll speed).
- Card row: fade-in stagger on scroll.
- Related Articles thumbnails: hover reveals date + headline overlay.

- The center "Logos Builder Hub" card in the 3-card row has a dark circular image — this is a `<Card>` with `forceHover` and a specific circular image crop.
- This layout pattern (breadcrumb → header → hero split → features → 3-card → explore → related) is **shared by all four tech sub-pages** (Blockchain, Networking, Messaging, Storage). Build it as a reusable template.

---

## 4. Networking

**Route:** `/technology-stack/networking`
**Figma section:** `40009046:21377`
**Desktop frame:** `40009046:21445` — 1440 × 4525
**Mobile frame:** `40009046:21378` — 393 × 5752

Same template as Blockchain. Unique content:

1. **Page header** — `Lambda icon Networking Stack`
2. **Hero split** — "Privacy built from the ground up." + body + `LEARN MORE →`; tall editorial photograph right.
3. **Three feature cards** — The Blacklist, Decentrality Governance Protocol, Taming Logic (horizontal image cards with dark photo backgrounds + text overlay).
4. **Three-card row** — Store, Logos Builder Hub (center), Logos App.
5. **Explore / Related Articles / Footer** — same as Blockchain.

- The three feature cards (Blacklist, Decentrality, Taming Logic) are landscape image cards with a title and short description overlaid at the bottom — different from the `<Card>` primitive. May need a `FeatureCard` variant.

---

## 5. Messaging

**Route:** `/technology-stack/messaging`
**Figma section:** `40009046:21599`
**Desktop frame:** `40009046:21710` — 1440 × 5444
**Mobile frame:** `40009046:21600` — 393 × 5506

Same template as Blockchain. Unique content:

1. **Page header** — `Lambda icon Messaging`
2. **Hero split** — "Privacy built from the ground up." + body; right: tall photo.
3. **Logos Messaging from ILMH** — text block with a second full-bleed image beneath.
4. **Case Studies** — two-column card layout with photo, title, description. Each card has a `VIEW CASE STUDY →` link.
5. **Three-card row** — Store, Logos Builder Hub (center), Logos App.
6. **Explore / Related Articles / Footer**

- The Case Study cards are a new layout pattern — larger than `<Card>`, landscape orientation, photo left + text right (desktop), stacked (mobile).

---

## 6. Storage

**Route:** `/technology-stack/storage`
**Figma section:** `40009046:21993`
**Desktop frame:** `40009046:22067` — 1440 × 4558
**Mobile frame:** `40009046:21994` — 393 × 4992

Same template as Blockchain. Unique content:

1. **Page header** — `Lambda icon Storage` + two CTAs: `SIGN UP →` and `LEARN MORE →`.
2. **Hero split** — "Private, Secure, Decentralised Storage." + body + `FIND OUT MORE →`; right: tall portrait photograph.
3. **Three-card row** — Dero, Logos Builder Hub (center), Logos App.
4. **Explore / Related Articles / Footer**

- Storage has two CTAs in the page header (Sign Up + Learn More) — other tech pages have one. Header component must support an optional second CTA.

---

## 7. Builders Hub

**Route:** `/builders-hub`
**Figma section:** `40009046:23763`
**Desktop frame:** `40009046:23948` — 1440 × 4573
**Mobile frame:** `40009046:23764` — 393 × 5279
**Builder Hub Dev Handoff page:** `2211:26807`

1. **Page header** — "Logos Builders Hub" large serif title.
2. **Numbered RFP list** — `<Table>` + `<TableRow>` with title, description, reward (`USDC + XP`), and `VIEW` / date links.
3. **App Install banner** — `<GiantSwitch>` (`accent="grey"`).
4. **RFPs** — section heading + `FILTER BY →` + `SEE ALL →`; 4-column `<Card>` grid (Attack Resistant Public Registries, Decentralised Archives, Private Financial Networks, Community Governance Processes, + "See all ideas" card). Desktop: 4 cols; mobile: 2 cols.
5. **Ideas** — `<Table>` + `<TableRow>` for 5 ideas with `VIEW` actions.
6. **CTA module** — "Get started faster with Logos: Logos App" dark rounded banner with QR code on the right. Desktop only.
7. **Additional Resources** — `<Table>` with 4 resource links.
8. **Footer**

- RFP table rows: hover → `bg-accent-light-blue` transition (built into `<TableRow>`).
- Card grid: stagger fade-in on scroll enter.

- The "See all ideas" card in the RFP grid is a CTA-only card with just an arrow — treat as a variant of `<Card>`.
- The CTA module with the QR code collapses or is hidden on mobile.
- There is an "Offline Hours" blurred card to the right of the QR code module — secondary info panel.

---

## 8. Builders Hub — Ideas

**Route:** `/builders-hub/ideas`
**Figma section:** `40009046:24677`
**Desktop frame:** `40009046:24754` — 1440 × 2160
**Mobile frame:** `40009046:24678` — 393 × 2423
**Builder Hub Dev Handoff:** Ideas section — `2213:30214`

1. **Sub-nav breadcrumb** — `← BUILDERS HUB`
2. **Page header** — `Lambda icon Ideas` + description + `SUBMIT AN IDEA →` CTA (top-right).
3. **Grid / List toggle** — default: **List** view.
4. **List view** — `<Table>` + `<TableRow>` × 10 with number, title, description, submitter, `VIEW` button. No reward column.
5. **Pagination** — `← 1 2 3 →`
6. **"We want your ideas."** — full-width centered CTA section, `SUBMIT AN IDEA →` button.
7. **Footer**

- Grid view shows `<Card>` (type: idea) in a 4-col grid. Cards show title, `LEARN MORE`, image, description, "Idea by @username".
- Toggle state persists in URL query param (`?view=grid` / `?view=list`) for shareability.

---

## 9. Builders Hub — RFPs

**Route:** `/builders-hub/rfps`
**Figma section:** `40009046:24923`
**Desktop frame (grid view):** `40009046:25012` — 1440 × 2438
**Desktop frame (list view):** `2259:42388` — 1440 × 2438
**Mobile frame:** `40009046:24924` — 393 × 3902
**Builder Hub Dev Handoff:** RFPs section — `2213:32470`

Same shell as Ideas. Unique content:

1. **Page header** — `Lambda icon RFPs` + description + `SUBMIT AN RFP →` CTA.
2. **Grid / List toggle** — default: **Grid** view.
3. **Grid view** — `<Card>` (type: rfp) in 4-col grid. Cards show title, reward (`USDC + XP`), `APPLY →`, image, description.
4. **List view** — `<Table>` + `<TableRow>` × 10 with reward column + `APPLY` button.
5. **Pagination** — `← 1 2 3 →`
6. **"We want your ideas."** — same CTA section as Ideas.
7. **Footer**

- RFP cards show `2500 USDC + 1000 XP` reward and `APPLY →` instead of `LEARN MORE`.
- RFPs default to grid; Ideas default to list — intentional per handoff labels.

---

## 10. Logos Circles

**Route:** `/circles`
**Figma section:** `40009046:25109`
**Desktop frame:** `40009046:25359` — 1440 × 4160
**Mobile frame:** `40009046:25110` — 393 × 4923

1. **Page header** — `Lambda icon Logos Circles` title + description + `FIND A CIRCLE →` + `JOIN A CIRCLE →` CTAs.
2. **World map** — interactive SVG world map with `Lambda icon` markers at each circle location. `+` / `−` zoom controls. Individual circle landing pages are out of scope for now, so markers must not navigate to `/circles/[slug]` while `ROUTE_AVAILABILITY.circleDetailLinks` is disabled.
3. **"Find a Circle near you."** — centered text + `FIND A CIRCLE NEAR YOU →` button.
4. **Upcoming Events** — section header + `SEE FULL CALENDAR →`; event cards in a 2-col grid. Each card: image thumbnail, circle name, event title, date/time, location, hosted-by line.
5. **Winnable Issues** — 3-col card row (dark image cards with location tag, `VIEW ISSUE →`, title, description).
6. **Circles Resources** — `<Table>` + `<TableRow>` × 3 with resource links and `LEARN MORE` actions.
7. **Footer**

- World map markers: pulse animation on load (scale 1 → 1.2 → 1, looping, staggered per marker).
- Map pan/zoom: smooth CSS transition on `+` / `−` click.
- Upcoming Events cards: fade-in stagger on scroll.

- World map is a significant interactive component — use `react-simple-maps` or a custom SVG. Markers are `Lambda icon` glyphs styled as pins.
- On mobile the map should be pannable/zoomable with touch.
- The `<WorldMap>` component is **shared with the About page** — extract accordingly.

---

## 11. Circle Detail Page

**Route:** `/circles/[slug]`
**Figma section:** `40009046:25921`
**Desktop frame:** `40009046:26015` — 1440 × 2014
**Mobile frame:** `40009046:25922` — 393 × 2735
**Current status:** Not needed for the current release. Keep the implementation and content fixtures, but do not index or link to individual circle landing pages while `ROUTE_AVAILABILITY.circleDetailLinks` is disabled. The static export may still emit these routes while the route file exists.

1. **Breadcrumb** — `← ALL CIRCLES`
2. **Circle header** — `Lambda icon [City Name]` title + description + `JOIN THIS CIRCLE →` CTA. Below: metadata grid — `MEMBERS`, `DISCORD`, `FORUM`.
3. **Upcoming Events** — 2 event cards (landscape image, circle badge, event title, date/time, location, hosted-by). Desktop: 2-col; mobile: stacked.
4. **Initiatives** — 2 initiative cards (dark bg, image, location tag, `VIEW ISSUE →`, title, description). Desktop: 2-col; mobile: stacked.
5. **Footer**

- Dynamic route — `[slug]` maps to a circle identifier (e.g. `los-angeles`).
- Initiative cards use dark background images with white text — same visual pattern as Winnable Issues on the Circles listing page.

---

## 12. Press Engine

**Route:** `/press`
**Figma section:** `40009046:26291`
**Desktop frame:** `40009046:26490` — 1440 × 6214
**Mobile frame:** `40009046:26292` — 393 × 6823

1. **Page header** — "The Logos Press Engine" serif title.
2. **Article list (above fold)** — numbered rows with thumbnail (left), date, headline, read-time. Desktop: image + text side by side; mobile: stacked.
3. **Image grid break** — 3–4 press images in a horizontal full-bleed row.
4. **More article rows** — continuation of the numbered list.
5. **Featured article** — large full-bleed image with serif headline overlaid bottom-left. `READ →` CTA.
6. **Additional article rows** — post-featured list continues.
7. **Podcasts section** — "Podcasts" heading + featured podcast card (dark bg, blurred image, description) + episode list rows with play/listen links.
8. **Footer**

- Article rows: hover → `bg-accent-light-blue` transition (same as `<TableRow>`).
- Featured article image: subtle scale on hover (`scale: 1 → 1.02`, 200 ms).

- Article list uses a numbered index with thumbnail — may need a `PressRow` component (image + index + date + headline + read-time).
- Podcast card shares the dark-tinted image aesthetic with `<GiantSwitch>`.
- "Related Articles" on tech sub-pages pulls from this same press data — share the data layer.

---

## 13. About

**Route:** `/about`
**Figma section:** `40009046:27109`
**Desktop frame:** `40009046:27248` — 1440 × 6004
**Mobile frame:** `40009046:27110` — 393 × 6332
**Current status:** Not needed for the current release. Keep the implementation and assets, but do not surface it in navigation, sitemap, or homepage CTAs while `ROUTE_AVAILABILITY.about` is disabled.

1. **Hero** — "Logos is on a mission to revitalise Civil Society." very large display headline, full-bleed dark background image.
2. **Community teaser** — `<WorldMap>` (shared with Circles) + "We are a community of builders…" body + `LEARN MORE →`.
3. **Full-bleed mountain landscape** — cinematic wide image with small centered quote overlay.
4. **"Who We Are"** — serif heading + body copy.
5. **Our History** — sub-heading + timeline list (dated rows with image). Desktop: 2-col; mobile: stacked.
6. **Our Principles** — sub-heading + numbered list with descriptions.
7. **How We Work** — sub-heading + numbered list with descriptions.
8. **Our Work** — project showcase cards (3-col grid): image + title + date + `VIEW →`.
9. **Footer**

- Hero: same staggered headline fade-up as Homepage.
- Full-bleed mountain image: parallax scroll (~0.6× speed).
- History timeline items: fade-in stagger on scroll enter.
- Our Work cards: stagger fade-in on scroll.

- Hero background image sits behind the nav bar — `<SiteHeader>` needs off-white text color. Pass a `theme="dark"` prop or use CSS `color-scheme`.
- History / Principles / How We Work share a text-list layout — build as a reusable `<ContentList>` section.
- `<WorldMap>` is shared with the Circles page — extract as a standalone component.

---

## 14. FAQs

**Route:** `/faq`
**Figma section:** `40009046:22275`
**Desktop frame:** `40009046:22317` — 1440 × 800
**Mobile frame:** `40009046:22276` — 393 × 1602

1. **`<LegalLayout>` wrapper** — two-column: left sidebar + right content.
2. **Left sidebar** — vertical nav: Guides, Logos Forum, Research Forum, Brand Kit, Terms & Conditions, Privacy Policy, Security, FAQ. Active item prefixed with `●`.
3. **Right: "FAQ" heading**
4. **Accordion list** — 8 questions; first expanded by default. Each: question text + `+` / `−` icon; answer body revealed below.
5. **Footer**

- Accordion: `max-height` expand/collapse, 200 ms ease-out. Toggle icon: `+` rotates 45° on open.

- `<LegalLayout>` + `<LegalSidebar>` are **shared with Ts&Cs** (and future Privacy Policy, Security pages).
- On mobile, confirm from the mobile Figma frame whether the sidebar collapses to a dropdown or is hidden.

---

## 15. Terms & Conditions

**Route:** `/terms-and-conditions`
**Figma section:** `40009046:22241`
**Desktop frame:** `40009046:22250` — 1440 × 1802
**Mobile frame:** `40009046:22242` — 393 × 2237

1. **`<LegalLayout>`** — same wrapper as FAQs; `● TERMS & CONDITIONS` active in sidebar.
2. **"TERMS & CONDITIONS" eyebrow heading**
3. **Long-form body text** — multiple paragraphs, `text-body-sans`, line-length ~65 ch.
4. **Footer**

- No special interactions beyond shared sidebar nav.
- Privacy Policy and Security pages will use the same `<LegalLayout>` with different active items.

---

## Page implementation order (suggested)

| Priority | Page                      | Reason                                               |
| -------- | ------------------------- | ---------------------------------------------------- |
| 1        | Homepage                  | Entry point; establishes shared section modules      |
| 2        | Builders Hub              | Core product feature; reuses Table + Card primitives |
| 3        | Builders Hub / Ideas      | Establishes grid/list toggle pattern                 |
| 4        | Builders Hub / RFPs       | Same pattern as Ideas                                |
| 5        | Technology Stack Overview | Establishes tech pillar card grid                    |
| 6        | Blockchain                | Establishes tech sub-page template                   |
| 7        | Networking                | Same template                                        |
| 8        | Messaging                 | Same template                                        |
| 9        | Storage                   | Same template                                        |
| 10       | Logos Circles             | New interactive component (world map)                |
| 11       | Press Engine              | Standalone content page                              |
| 12       | FAQs                      | Establishes LegalLayout                              |
| 13       | Terms & Conditions        | Reuses LegalLayout                                   |
| Future   | Circle Detail Page        | Not needed for current release                       |
| Future   | About                     | Not needed for current release                       |

---

## Figma node quick reference

| Page                 | Section node     | Desktop frame    | Mobile frame     |
| -------------------- | ---------------- | ---------------- | ---------------- |
| Homepage             | `40009046:22441` | `40009046:22699` | `40009046:22442` |
| Tech Overview        | `40009046:20737` | `40009046:20804` | `40009046:20738` |
| Blockchain           | `40009046:21013` | `40009046:21116` | `40009046:21014` |
| Networking           | `40009046:21377` | `40009046:21445` | `40009046:21378` |
| Messaging            | `40009046:21599` | `40009046:21710` | `40009046:21600` |
| Storage              | `40009046:21993` | `40009046:22067` | `40009046:21994` |
| Builders Hub         | `40009046:23763` | `40009046:23948` | `40009046:23764` |
| Builders Hub / Ideas | `40009046:24677` | `40009046:24754` | `40009046:24678` |
| Builders Hub / RFPs  | `40009046:24923` | `40009046:25012` | `40009046:24924` |
| Circles              | `40009046:25109` | `40009046:25359` | `40009046:25110` |
| Circle Detail        | `40009046:25921` | `40009046:26015` | `40009046:25922` |
| Press Engine         | `40009046:26291` | `40009046:26490` | `40009046:26292` |
| About                | `40009046:27109` | `40009046:27248` | `40009046:27110` |
| FAQs                 | `40009046:22275` | `40009046:22317` | `40009046:22276` |
| Terms & Conditions   | `40009046:22241` | `40009046:22250` | `40009046:22242` |
