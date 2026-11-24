# RFP programme

The [RFP listing](../app/[locale]/rfp/page.tsx) and [detail pages](../app/[locale]/rfp/[slug]/page.tsx) use `/rfp` and `/rfp/<slug>`.

The programme landing page reads its shared desktop and mobile copy from [content/pages/en/rfp.json](../../../content/pages/en/rfp.json), validated by the [RFP programme schema](../../../packages/content/src/schemas/pages/rfp-programme.ts). Sections span the full viewport width, matching the developer programmes page. Explicit newlines and paragraph widths preserve the Figma desktop line endings at 1440px and wider. Smaller viewports reflow the same copy.

The page calls `loadRfpProgramme` in [`rfp-programme.ts`](../lib/rfp-programme.ts), which finds the `rfpProgrammeCopy` section with key `rfp.copy` and loads the GitHub RFPs in parallel. The page passes each part of the copy to a component in [`_sections/`](../app/[locale]/rfp/_sections/). In page order these are the hero, how it works, tiers, open RFPs, what you ship, who should apply, the terms, after the RFP and the final CTA. Page metadata comes from the `title` and `description` in the same JSON file. The breadcrumb structured data runs from the home page through developer programmes to `/rfp`, using the hero breadcrumb labels.

Payload Pages already edits and validates the complete page JSON through `pageCopySchema`; this section adds no Payload fields.

RFP identifiers, titles, categories, tiers and statuses still come from [the build-time GitHub loader](../lib/rfps-github.ts). [`rfp-programme.ts`](../lib/rfp-programme.ts) maps each published status to open, upcoming or closed: a status containing "reopen", "upcoming" or "coming soon" counts as upcoming, `open` counts as open, and anything else (such as `awarded`) counts as closed. It also drops the full Markdown, so the client component only receives the fields the listing shows.

The [front matter parser](../lib/yaml-front-matter.ts) parses metadata as YAML only. It accepts a plain `---` delimiter or one labelled `yaml` or `yml`, and throws on any other label, such as `json` or `js`. When a front matter block is invalid YAML or declares an unsupported format, the RFP loader logs the error, strips the block and reads the title and fields from the Markdown body headings and `**Field**` lines. The [legal document loader](../lib/legal-content.ts) uses the same YAML parser and requires valid metadata.

Counts and the open/upcoming, closed and all filters use those statuses. When no RFP is open or upcoming, the initial filter is All. The three illustrated specifications use GitHub titles with editorial descriptions and assets. If a filter contains none of those specifications, its first three results use the source summaries with the same illustrative artwork slots. Other matching specifications are available in an expandable list. Past deadlines from the design are not displayed. The listing offers its submission action when at least one RFP is open. The site reads GitHub during the build and refreshes on publication. Passing a deadline does not change the published status automatically.

Detail pages show the Apply action only for open RFPs. For upcoming and closed RFPs, `rfpDetailBody` also removes the specification's `## How to Apply` section (with or without the ✏️ prefix) from the Markdown body, keeping the sections around it.

The hero shows the total number of published RFPs and a status panel. The panel lists the first three open or upcoming RFPs, or the three illustrated specifications when none are open or upcoming.

Other pages call the same `loadRfpProgramme` loader, so they use the same copy and statuses as the listing. [`programme-cards.ts`](../lib/programme-cards.ts) gives the developer programmes panels on Get Started and Builders Hub up to four open RFPs. Each card links to its detail page and uses the listing's featured description and image when the RFP has one, else the GitHub summary. The link label comes from the listing's `learnMore` copy, and when no RFP is open the panel shows the `programmeData.noOpenRfps` message from `messages/<locale>.json`. [`programme-summaries.ts`](../lib/programme-summaries.ts) gives `/developer-programmes` its RFP count, the first open RFP as the highlight, and the next two open or upcoming RFPs with the listing's status labels. [Developer programmes](developer-programmes.md) covers that page.

The landing page retains the shared site header and footer, including their current copy, navigation and newsletter behaviour. Page-specific adjustments to that chrome are limited to background and text colours. The shared footer tagline currently uses the repository font; Rhymes Text remains a separate follow-up.

The sample-proposal link opens the repository proposal template. The notification link opens the RFP repository, where visitors can choose GitHub Watch notifications. Other CTAs lead to the existing proposal form, programme sections, PriFi, Lambda Prize, Discord and published terms.

`ROUTES.rfps` supplies listing links, detail links, canonical metadata, sitemap entries and cross-references in GitHub RFP Markdown. Navigation, footer and editable page CTA fixtures also point to `/rfp`.

The previous `/builders-hub/rfps` and `/builders-hub/rfps/<slug>` pages export redirect stubs using the [shared static redirect helper](../lib/static-redirect.tsx). Their canonical URLs point to the new routes, and old URLs stay out of the sitemap. JavaScript redirects retain the query string and hash, including listing filters and detail anchors. With JavaScript disabled, the meta refresh and fallback link lead to the destination without those client-only values. These are static redirects, not HTTP 301 responses, so they work on both Vercel previews and the production static host.

The `/lambda-prize` address is unchanged.
