# Lambda Prize

The [`/lambda-prize` page](../app/[locale]/lambda-prize/page.tsx) combines the [page fixture](../../../content/pages/en/lambda-prize.json) and [build-time GitHub prize data](../lib/lambda-prizes-github.ts).

The shared footer links to `/lambda-prize` and `/rfp` immediately after Roadmap, in that order. Labels and destinations are editable through the existing Site Footer content in [`footer.json`](../../../content/site/en/footer.json).

## Editing

In CMS **Pages**, open `lambda-prize` and edit its `page` JSON. The `lambdaPrizeCopy.prizes` array controls display order, short descriptions and featured images by prize ID. A prize without a `body` uses the first paragraph of its specification's Overview. Set `comingSoon: true` only for a draft that should appear publicly as a preview; the flag has no effect unless the specification's status is draft. Open prizes without a CMS entry follow the curated order, highest ID first. The featured listing uses open prizes with a featured image, and the section is hidden when none has one. The showcased past solutions, introduction and programme guidance remain editorial.

The [GitHub repository](https://github.com/logos-co/lambda-prize) owns prize titles, statuses, amounts, effort sizes and detail links. The loader lists `prizes/` and `solutions/` through the shared [GitHub Markdown helper](../lib/github-markdown.ts), which falls back to the jsDelivr mirror when the GitHub API fails. It reads each specification's status line, or its heading if the line is absent, and the amount and effort from Prize Structure. An open prize without a valid amount or effort fails the build. The live totals and largest prize count only open prizes. The awarded count uses closed prizes with a merged file in `solutions/`. A source failure stops the build so an empty listing cannot replace the deployed site.

[`lambda-programme.ts`](../lib/lambda-programme.ts) merges the CMS copy with the GitHub data. It formats amounts as US dollars for the page locale and builds each card's status label from "Open" or "Coming soon" plus the effort size. Open cards link "Learn more" to the GitHub specification; coming-soon cards have no action. The hero statistic labels stay editable in the CMS, but their values come from the GitHub data. The open prizes and "Already rewarded." descriptions are built from the `programmeData` messages in [`messages/en.json`](../messages/en.json), so the CMS no longer holds a `body` for those two sections. `/developer-programmes`, `/get-started` and `/builders-hub` reuse the same loader; [developer-programmes.md](developer-programmes.md) covers those pages.

The [schema](../../../packages/content/src/schemas/pages/lambda-prize.ts) validates the CMS copy. Saving follows the existing GitHub PR workflow against `develop`. Refresh existing drafts before editing the upcoming prize selection so the new `comingSoon` flag is present.

## Design and responsive behaviour

The [desktop Figma v3 frame](https://www.figma.com/design/MALNxrjLTCy0TA9vaWEwBs/Logos-Designs?node-id=3307-17200) is 1440px wide. Sections fill the viewport, including screens wider than the design frame; their grids and hero statistics expand with the available width. Copy newline escapes (`\n`) preserve its desktop line endings at that width and above. Below 1440px, text reflows; blank lines retain paragraph spacing. The hero introduction keeps its explicit break. `{mark}` renders the shared Logos mark and accessible brand name.

The [mobile frame](https://www.figma.com/design/MALNxrjLTCy0TA9vaWEwBs/Logos-Designs?node-id=3329-17246) is 393px wide and defines the mobile layout. Below 768px, the two monetary statistics precede the open and awarded counts, steps become vertical, and prize cards stack. Listing CTAs move below their cards, completed solutions show a full-width title with their repository link above it, and resources become compact horizontal rows. Intermediate widths use two-column prize cards and three-column steps where appropriate. Mobile CTA dimensions follow the Figma frame; tablet CTAs have at least 44px targets. The shared site header uses its default dark text on the light hero.

Copy and punctuation follow the desktop Figma text layers. Both layouts use the title "Already rewarded."; the eyebrow and navigation label remain "Already shipped". The resource callout retains Figma's "RFP Program" spelling. The next-round callout has been removed from both layouts and the content schema. Existing CMS drafts should be refreshed from the fixture before editing.

Display and body text use the site's font variables. Monospace text uses Fira Code, loaded as `programmeMono` from the generated [Google fonts module](../app/google-fonts.ts), which the page shares with `/developer-programmes`. [fonts.md](fonts.md) covers the site's fonts.

## Images

Seven original Figma image exports live in [`public/images/lambda-prize/v3`](../public/images/lambda-prize/v3/). The [picture component](../app/[locale]/lambda-prize/_sections/picture.tsx) serves responsive AVIF/WebP variants while retaining each design crop. The hero loads eagerly and other images load lazily. A custom CMS image path uses the supplied source directly.

After replacing a bundled original, run `pnpm --filter web generate:lambda-prize-images` and commit the generated variants. The [generator](../scripts/generate-lambda-prize-images.ts) uses the [asset widths](../app/[locale]/lambda-prize/_sections/image-assets.ts), preserves the original aspect ratio, and does not enlarge source images. Review both desktop and mobile crops after replacement.
