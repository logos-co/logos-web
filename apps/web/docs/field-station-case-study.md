# Field Station case study

The [Field Station case study](../app/[locale]/case-studies/field-station/page.tsx) renders at `/case-studies/field-station` using [page content](../../../content/pages/en/case-studies-field-station.json) validated by the [content schema](../../../packages/content/src/schemas/pages/field-station-case-study.ts).

The page presents the Rajasthan residency, the four winning prototypes, follow-up support, the Logos stack and a Basecamp diagram. The project selector supports tabs, arrow keys, previous and next controls, and swipe. The Basecamp buttons use the shared platform-aware download resolver. The final link leads to the Muster case study.

The testimonial uses a night photograph with a quotation at the top on desktop, and a sunset photograph with the quotation at the bottom on mobile. The quotation remains the bracketed Figma placeholder until the final wording is supplied. Pukaar and Dhun Commons use the supplied Figma images. The Bosphorus image slot remains empty until its final asset is supplied. The next Field Station application destination is not established, so the page links to the existing Field Station campaign instead. The page uses the requested count of 17 projects.

The case study keeps the compact navigation through tablet and narrow laptop widths, and uses the desktop navigation when its links have room. Sections span the viewport with 12px side padding, matching the Muster and RAILGUN case studies. The cover pins only when it fits the viewport. The shared case study motion draws the cover line, reveals the cover and photographs, counts the statistics and animates the diagram connections. Reduced motion leaves the finished page visible.
