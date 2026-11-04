# Developer programmes

The [`/developer-programmes` page](../app/[locale]/developer-programmes/page.tsx) renders the [page fixture](../../../content/pages/en/developer-programmes.json) through the shared content loader and CMS page workflow.

## Editing

In CMS **Pages**, open the `developer-programmes` record and edit its `page` JSON. The normal content sync imports this fixture after deployment. Saving uses the existing validated GitHub PR workflow against `develop`; publication follows the normal CMS publishing process.

The `developerProgrammesCopy` section groups `hero`, `programmes`, comparison and choice headings, `choiceHelp`, `principles`, `statement`, and `resources`. Each programme owns its labels, descriptions, statistics, highlighted opportunity, further opportunities, CTA, comparison rows and choice statements. Its CTA and name are reused across the page. Image paths and alternative text are editable alongside the copy. Page title, description and SEO fields use the standard page metadata.

The [schema](../../../packages/content/src/schemas/pages/developer-programmes.ts) validates both the build-time loader and the CMS save operation. The existing Pages JSON field stores the section without new database fields or a database migration.

The schema fixes some parts of the page structure, and a save that breaks them fails. `programmes` holds exactly two entries, `rfp` first and `prize` second. Each programme needs exactly three `stats`, `principles.items` needs exactly three entries and `mobile.programmeImages` exactly two. Other lists can grow or shrink: opportunities may be empty, while comparison rows, choice statements and resource items each need at least one entry. Copy and link labels must be non-empty, apart from the optional `availability` label on a programme panel. Image alternative text may be empty, as it is in the fixture. Link destinations go through the shared link check, which rejects unsafe values such as `javascript:` URLs.

Each programme has a `tag` for its image panel and a separate `comparisonTag` for the comparison card. Edit them independently when their wording differs.

Page CTAs use the shared web Button: external HTTP(S) destinations open in a new tab with `noopener noreferrer`, while internal routes and section anchors stay in the current tab. This applies to desktop and mobile, including the resource links and Discord CTA.

## Desktop line breaks

The [Figma frame](https://www.figma.com/design/MALNxrjLTCy0TA9vaWEwBs/Logos-Designs?node-id=3270-17265) is 1440px wide. Newline escapes (`\n`) in body copy preserve its desktop line endings at widths of 1440px and above. Edit these breaks with the copy and review the result at 1440px. Below that width, copy wraps to the available space; the large programme and statement headings retain their deliberate breaks.

## Mobile layout

Below 768px, the page follows the [393px mobile frame](https://www.figma.com/design/MALNxrjLTCy0TA9vaWEwBs/Logos-Designs?node-id=3328-17344) and [expanded Prize card](https://www.figma.com/design/MALNxrjLTCy0TA9vaWEwBs/Logos-Designs?node-id=3378-19248). Programme cards start closed and can be expanded independently. The comparison uses paired columns, followed by centred choice capsules, ruled principles, a compact statement and resource rows.

Desktop and mobile share the desktop Figma copy. Editing a heading, comparison tag or row, choice statement, or statement paragraph updates both layouts. The comparison keeps each programme's own label when the two columns use different wording. The section's `mobile` object contains only the expand/collapse labels and programme card images. Heading newlines preserve the mobile line breaks while desktop headings render on one line. Refresh existing CMS drafts from the fixture before editing.

Mobile CTA dimensions follow Figma. Tablet widths from 768px to 1439px retain 44px minimum CTA targets. Desktop CTA dimensions retain the Figma measurements.

The RFP statistics give the longer delivery-time value a wider middle column on desktop, correcting an overlap in the supplied Figma frame without changing the copy or type size. Edited statistics wrap within their columns.

`{mark}` inserts the shared Logos mark in programme names, headings and body copy. Keep that token wherever the brand mark should appear. Do not replace it with an image or a Unicode substitute.

The programme figures, opportunity names and deadlines are editorial copy matching the supplied design, not a live GitHub feed. Editors maintain them through the page fixture. Header, navigation and footer content remain owned by their existing site collections.

## Monospace font

The [page font module](../app/[locale]/developer-programmes/fonts.ts) loads Fira Code from `next/font/google` (weights 400, 500 and 600) and exposes it as `--developer-programmes-mono`. The `/lambda-prize` page imports the same font. Other site fonts are covered in [fonts.md](fonts.md).

## Images

The [image component](../app/[locale]/developer-programmes/_sections/programme-image.tsx) serves the three bundled backgrounds through responsive AVIF sources at 640, 1280, 1920 and 2560px, with WebP alternatives for browsers without AVIF support. The original exports remain unchanged. On desktop the first programme image loads eagerly and the other backgrounds load lazily; the small mobile programme card images load eagerly. Custom image paths entered in CMS use their supplied source directly.

Dark section backgrounds keep the overlaid text readable while images load or if a request fails.

Background picture elements are absolutely positioned so they do not occupy a grid column or push section copy into another row.

After replacing a bundled original, run `pnpm --filter web generate:programme-images` and commit the regenerated variants. The [generator](../scripts/generate-programme-images.ts) preserves the source aspect ratio and uses AVIF quality 60 and WebP quality 90. Review desktop and mobile crops before publishing.
