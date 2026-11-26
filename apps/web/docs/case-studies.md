# Case studies index

Scope: the placeholder [`/case-studies` page](../app/[locale]/case-studies/page.tsx) and its [page copy](../../../content/pages/en/case-studies.json).

The index has an empty viewport-height body with the shared site header and footer. It is marked `noindex` and omitted from the sitemap until the hub content is ready. Existing case study detail routes remain available.

The Explore menu links to the index from its About section. Its label, description and thumbnail come from [navigation content](../../../content/site/en/navigation.json). The shared [navigation overlay](../../../packages/ui/src/primitives/nav-overlay/nav-overlay.tsx) uses two columns and shorter desktop cards for Explore, retaining the existing card width at large breakpoints.
