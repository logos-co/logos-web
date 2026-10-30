# Developer programmes

The [`/developer-programmes` page](../app/[locale]/developer-programmes/page.tsx) renders the [page fixture](../../../content/pages/en/developer-programmes.json) through the shared content loader and CMS page workflow.

## Editing

In CMS **Pages**, open the `developer-programmes` record and edit its `page` JSON. The normal content sync imports this fixture after deployment. Saving uses the existing validated GitHub PR workflow against `develop`; publication follows the normal CMS publishing process.

The `developerProgrammesCopy` section groups `hero`, `programmes`, comparison and choice headings, `choiceHelp`, `principles`, `statement`, and `resources`. Each programme owns its labels, descriptions, statistics, highlighted opportunity, further opportunities, CTA, comparison rows and choice statements. Its CTA and name are reused across the page. Image paths and alternative text are editable alongside the copy. Page title, description and SEO fields use the standard page metadata.

The [schema](../../../packages/content/src/schemas/pages/developer-programmes.ts) validates both the build-time loader and the CMS save operation. The existing Pages JSON field stores the section without new database fields or a database migration.

Each programme has a `tag` for its image panel and a separate `comparisonTag` for the comparison card. Edit them independently when their wording differs.

## Desktop line breaks

The [Figma frame](https://www.figma.com/design/MALNxrjLTCy0TA9vaWEwBs/Logos-Designs?node-id=3270-17265) is 1440px wide. Newline escapes (`\n`) in body copy preserve its desktop line endings at widths of 1440px and above. Edit these breaks with the copy and review the result at 1440px. Below that width, copy wraps to the available space; the large programme and statement headings retain their deliberate breaks.

Below 1440px, page CTAs have a minimum 44px touch target. Desktop CTA dimensions retain the Figma measurements.

The RFP statistics give the longer delivery-time value a wider middle column on desktop, correcting an overlap in the supplied Figma frame without changing the copy or type size. Edited statistics wrap within their columns.

`{mark}` inserts the shared Logos mark in programme names, headings and body copy. Keep that token wherever the brand mark should appear. Do not replace it with an image or a Unicode substitute.

The programme figures, opportunity names and deadlines are editorial copy matching the supplied design, not a live GitHub feed. Editors maintain them through the page fixture. Header, navigation and footer content remain owned by their existing site collections.

## Images

The [image component](../app/[locale]/developer-programmes/_sections/programme-image.tsx) serves the three bundled backgrounds through responsive AVIF sources at 640, 1280, 1920 and 2560px, with WebP alternatives for browsers without AVIF support. The original exports remain unchanged. The first programme image loads eagerly; the other backgrounds load lazily. Custom image paths entered in CMS use their supplied source directly.

Dark section backgrounds keep the overlaid text readable while images load or if a request fails.

Background picture elements are absolutely positioned so they do not occupy a grid column or push section copy into another row.

After replacing a bundled original, run `pnpm --filter web generate:programme-images` and commit the regenerated variants. The [generator](../scripts/generate-programme-images.ts) preserves the source aspect ratio and uses AVIF quality 60 and WebP quality 90. Review desktop and mobile crops before publishing.
