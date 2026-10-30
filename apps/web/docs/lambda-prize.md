# Lambda Prize

The [`/lambda-prize` page](../app/[locale]/lambda-prize/page.tsx) renders the [v3 page fixture](../../../content/pages/en/lambda-prize.json) through the shared content loader and CMS page workflow.

## Editing

In CMS **Pages**, open `lambda-prize` and edit its `page` JSON. The `lambdaPrizeCopy` section contains the hero, statistics, featured introduction, prizes, steps and requirements, rules, ownership statement, rewarded solutions, resources and final CTA. All visible copy, amounts, status labels, images and link destinations are editable. Metadata uses the standard page title, description and SEO fields.

Mobile-specific wording is editable in `howItWorks.requirements.mobileHeading`, `rewarded.mobileHeading`, and `resources.rfp.mobile.title` / `body`. These fields preserve the distinct text in the mobile Figma frame without changing desktop copy. The requirements mobile heading supports explicit newline escapes.

The `prizes` array is the source for both listings. A prize with a `featured` image and description also appears in the featured listing; its title, amount, status and CTA remain shared. Omit `cta` when an upcoming prize has no destination. Statistics are editorial values matching the design, not a live GitHub feed. Solution links point to the repositories identified in the published solution records.

The [schema](../../../packages/content/src/schemas/pages/lambda-prize.ts) validates both build-time loading and CMS saves. The existing Pages JSON field requires no additional Payload fields or database migration. Saving follows the existing GitHub PR workflow against `develop`. This change replaces the earlier Lambda Prize section shape, so existing CMS drafts must be refreshed from the new fixture before editing.

## Design and responsive behaviour

The [desktop Figma v3 frame](https://www.figma.com/design/MALNxrjLTCy0TA9vaWEwBs/Logos-Designs?node-id=3307-17200) is 1440px wide. Sections fill the viewport, including screens wider than the design frame; their grids and hero statistics expand with the available width. Copy newline escapes (`\n`) preserve its desktop line endings at that width and above. Below 1440px, text reflows; blank lines retain paragraph spacing. The hero introduction keeps its explicit break. `{mark}` renders the shared Logos mark and accessible brand name.

The [mobile frame](https://www.figma.com/design/MALNxrjLTCy0TA9vaWEwBs/Logos-Designs?node-id=3329-17246) is 393px wide and defines the mobile layout. Below 768px, the two monetary statistics precede the open and awarded counts, steps become vertical, and prize cards stack. Listing CTAs move below their cards, completed solutions show a full-width title with their repository link above it, and resources become compact horizontal rows. Intermediate widths use two-column prize cards and three-column steps where appropriate. Mobile CTA dimensions follow the Figma frame; tablet CTAs have at least 44px targets. The shared site header uses its default dark text on the light hero; the shared footer remains unchanged.

Copy follows the current Figma text layers. The desktop title is "Already rewarded." and the mobile title is "Already shipped."; the eyebrow and navigation label remain "Already shipped". The resource callout retains Figma's "RFP Program" spelling. Apostrophes use ASCII punctuation. The next-round callout retains the current Figma wording; comment #423 remains subject to the design team's eco-dev confirmation. The page implementation does not resolve or approve that comment.

The page uses the site's licensed Rhymes Display, Public Sans and Fira Code. Figma uses a trial Rhymes font; the licensed font has minor contour differences, as documented in the prior programme implementation.

## Images

Seven original Figma image exports live in [`public/images/lambda-prize/v3`](../public/images/lambda-prize/v3/). The [picture component](../app/[locale]/lambda-prize/_sections/picture.tsx) serves responsive AVIF/WebP variants while retaining each design crop. The hero loads eagerly and other images load lazily. A custom CMS image path uses the supplied source directly.

After replacing a bundled original, run `pnpm --filter web generate:lambda-prize-images` and commit the generated variants. The [generator](../scripts/generate-lambda-prize-images.ts) uses the [asset widths](../app/[locale]/lambda-prize/_sections/image-assets.ts), preserves the original aspect ratio, and does not enlarge source images. Review both desktop and mobile crops after replacement.
