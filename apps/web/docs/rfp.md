# RFP URLs

The [RFP listing](../app/[locale]/rfp/page.tsx) and [detail pages](../app/[locale]/rfp/[slug]/page.tsx) use `/rfp` and `/rfp/<slug>`.

`ROUTES.rfps` supplies listing links, detail links, canonical metadata, sitemap entries and cross-references in GitHub RFP Markdown. Navigation, footer and editable page CTA fixtures also point to `/rfp`.

The previous `/builders-hub/rfps` and `/builders-hub/rfps/<slug>` pages export redirect stubs using the [shared static redirect helper](../lib/static-redirect.tsx). Their canonical URLs point to the new routes, and old URLs stay out of the sitemap. JavaScript redirects retain the query string and hash, including listing filters and detail anchors. With JavaScript disabled, the meta refresh and fallback link lead to the destination without those client-only values. These are static redirects, not HTTP 301 responses, so they work on both Vercel previews and the production static host.

The `/lambda-prize` address is unchanged.
