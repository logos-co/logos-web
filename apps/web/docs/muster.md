# Muster case study

The [Muster page](../app/[locale]/case-studies/muster/page.tsx) renders the case study at `/case-studies/muster`.

Each section's content container spans the viewport with 12px side padding, matching the RAILGUN case study.

Page copy and CTA destinations come from [case-studies-muster.json](../../../content/pages/en/case-studies-muster.json). The supplied JPEG lake banner is preserved without further compression and is separate from the 1200 x 600 social card, which includes its own text and is used for Open Graph and Twitter previews. The link-preview title is "Muster / Logos | Case Study". Diagram assets follow the [desktop Figma frame](https://www.figma.com/design/MALNxrjLTCy0TA9vaWEwBs/Logos-Designs?node-id=3957-17134). The architecture columns and seven PriFi stages stack on narrow screens.

The cover stays pinned on wider screens only when its full content fits the viewport; otherwise it scrolls normally. The experiment disclaimer sits below the title in a readable, unanimated paragraph with a maximum width of 640px. A line draws before the cover image opens downwards and settles from a slight zoom. The title follows while the image opens; scrolling or interacting skips the remaining entrance. The 3, 4 and 7 statistics count up once on entering the viewport, with static values for screen readers. The Basecamp schematic draws its existing connections and briefly highlights the linked nodes, with each group triggered separately on mobile. Body copy is visible immediately. Entrances respect changes to the system reduced-motion setting and leave the final content visible without JavaScript.

The next case study links to RAILGUN when its content is available in the same build.

The overview and Split the bill sections use the supplied MP4 demos with native playback controls, inline playback and full-screen support. Both keep their original aspect ratios. Video frames provide the posters, and `preload="none"` defers the video download until playback. Muted inline playback starts in the central 30% of the viewport and pauses on leaving it or hiding the tab. Reduced motion disables automatic playback; the native controls remain available. The FileShare and Monero multisig demos remain placeholders until their assets are supplied.
