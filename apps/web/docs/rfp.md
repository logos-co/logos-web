# RFP programme

The [RFP listing](../app/[locale]/rfp/page.tsx) and [detail pages](../app/[locale]/rfp/[slug]/page.tsx) use `/rfp` and `/rfp/<slug>`.

The programme landing page reads its shared desktop and mobile copy from [content/pages/en/rfp.json](../../../content/pages/en/rfp.json), validated by the [RFP programme schema](../../../packages/content/src/schemas/pages/rfp-programme.ts). Sections span the full viewport width, matching the developer programmes page. Explicit newlines and paragraph widths preserve the Figma desktop line endings at 1440px and wider. Smaller viewports reflow the same copy.

The page finds the `rfpProgrammeCopy` section with key `rfp.copy` and passes each part of it to a component in [`_sections/`](../app/[locale]/rfp/_sections/). In page order these are the hero, how it works, tiers, open RFPs, what you ship, who should apply, the terms, after the RFP and the final CTA. Page metadata comes from the `title` and `description` in the same JSON file. The breadcrumb structured data runs from the home page through developer programmes to `/rfp`, using the hero breadcrumb labels.

Payload Pages already edits and validates the complete page JSON through `pageCopySchema`; this section adds no Payload fields.

RFP identifiers, titles, categories, tiers and statuses still come from [the build-time GitHub loader](../lib/rfps-github.ts). [`rfp-items.ts`](../app/[locale]/rfp/_sections/rfp-items.ts) maps each published status to open, upcoming or closed: a status containing "reopen", "upcoming" or "coming soon" counts as upcoming, `open` counts as open, and anything else (such as `awarded`) counts as closed. It also drops the full Markdown, so the client component only receives the fields the listing shows.

Counts and the open/upcoming, closed and all filters use those statuses. When no RFP is open or upcoming, the initial filter is All. The three illustrated specifications use the design titles, copy and assets. If a filter contains none of those specifications, its first three results use the source summaries with the same illustrative artwork slots. Other matching specifications are available in an expandable list. Past deadlines from the design are not displayed. No GitHub requests run in the browser.

The hero shows the total number of published RFPs and a status panel. The panel lists the first three open or upcoming RFPs, or the three illustrated specifications when none are open or upcoming.

The landing page retains the shared site header and footer, including their current copy, navigation and newsletter behaviour. Page-specific adjustments to that chrome are limited to background and text colours. The shared footer tagline currently uses the repository font; Rhymes Text remains a separate follow-up.

The sample-proposal link opens the repository proposal template. The notification link opens the RFP repository, where visitors can choose GitHub Watch notifications. Other CTAs lead to the existing proposal form, programme sections, PriFi, Lambda Prize, Discord and published terms.

`ROUTES.rfps` supplies listing links, detail links, canonical metadata, sitemap entries and cross-references in GitHub RFP Markdown. Navigation, footer and editable page CTA fixtures also point to `/rfp`.

The previous `/builders-hub/rfps` and `/builders-hub/rfps/<slug>` pages export redirect stubs using the [shared static redirect helper](../lib/static-redirect.tsx). Their canonical URLs point to the new routes, and old URLs stay out of the sitemap. JavaScript redirects retain the query string and hash, including listing filters and detail anchors. With JavaScript disabled, the meta refresh and fallback link lead to the destination without those client-only values. These are static redirects, not HTTP 301 responses, so they work on both Vercel previews and the production static host.

The `/lambda-prize` address is unchanged.
