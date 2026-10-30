# Waku article migration

This covers the [Waku conversion scripts](../scripts/waku-migration/), the [staging allowlist](../lib/press-preview-articles.json) and [media snapshots](../lib/press-snapshot.ts).

## Source and conversion

The source is `acid-info/blog.waku.org` at commit `9bfb4204deed79c2333a86fe0342cf4a4ede2568`: 18 English articles in `posts/`, with 16 referenced images under `static/`. Exclude `index.mdx`, Spanish translations and the Spanish switch in the Vue tutorial. Empty source `published` values do not exclude an article.

The converter preserves the original title, slug, date, authors, prose, code examples, tables, image alternatives and captions. It shifts body headings down one level where a source uses H1, leaving the page title as the sole H1. Internal links to migrated articles use `/media/article/<slug>` and retain queries and fragments. The source discussion link remains accessible. The X Space quotation and links remain in static HTML. The article renderer progressively enhances that quotation with the official X widget; indexing the article never depends on that script. The device-pairing article has no source cover, so it uses the existing Waku logo.

Rendered HTML goes in Strapi `body`; the complete source goes in `markdown_body`. Neither `html_file` nor an iframe contains the article body. The existing article renderer produces the HTML, metadata and Article structured data at build time.

## Prepare and import

Run from `apps/web`, using a local source checkout and an output directory outside the repository:

```bash
pnpm exec tsx scripts/waku-migration/prepare.ts /path/to/blog.waku.org /path/to/migration-output
pnpm exec tsx --env-file=.env.local scripts/waku-migration/import.ts /path/to/migration-output --apply
```

Preparation writes `plan.json`, original sources, assets and a redirect map. Review the plan before import. Import requires a Strapi token with post, author, tag and upload permissions. It uploads content-addressed images, reuses existing authors/tags, creates draft Articles and records IDs in `imported.json`. It rejects collisions with existing content or published articles. Repeating the same import reuses identical drafts and assets; it does not overwrite editorial changes.

## Staging and production

Only `NEXT_PUBLIC_API_MODE=staging` enables the explicit preview slugs. Those articles can be drafts; unrelated drafts remain excluded. Approved previews appear in article listings and site search, but remain absent from public feeds and the sitemap while unpublished. Staging metadata remains `noindex`.

A snapshot containing drafts uses version 2. Older production code accepts only version 1, and the updated reader rejects version 2 outside staging. This prevents a staging snapshot from publishing draft articles through the existing production promotion workflow.

After review, publish the selected CMS posts and capture a new staging build. It must produce a version 1 snapshot before production promotion. Production queries still use only published CMS content. Coordinate per-article HTTP 301 redirects from the Waku host only after verifying the production destinations; the scripts only produce a redirect map and do not change infrastructure.

See [deployment](../../../docs/deployment.md) for the staging build and production promotion process.

## Rendering corrections

The article detail hero suppresses a repeated cover or summary when the migrated body already contains it. The body retains its original image position, alternative text and caption; cards, social metadata and search still use the cover and summary. Only the 18 migrated slugs use this presentation rule. An exact repeated leading title becomes an empty fragment target, retaining incoming anchors without duplicating the H1 or table of contents.

The converter normalises legacy MDX underline JSX and bold delimiters with trailing spaces. It also separates a standalone HTML break from following Markdown so the AI article's Waku link renders as a link. Parsed fenced and inline code ranges are excluded from these transformations. The three malformed source destinations (`walu.org/events`, `discord.waku.org`, `logos.co`) become explicit HTTPS URLs, and the sharding link uses the actual heading ID.

To apply reviewed corrections to existing drafts, retain the original import directory and prepare a separate revised directory. Run `pnpm exec tsx --env-file=.env.local scripts/waku-migration/revise.ts /path/to/original-import /path/to/revised-plan --apply`. The revision script checks every draft against the original source and body before any write, saves an exclusive backup, rechecks before each update and changes only `body`. It refuses published posts or intervening editorial changes.

Verification must compare the pinned original MDX rendering with complete exported pages, including hero/body duplication, image alternatives and captions, links and fragment targets, emphasis, tables and exact code examples. Body-to-import-plan equality alone is insufficient. Verify all 18 pages on desktop and mobile after staging deployment.
