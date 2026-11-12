# RAILGUN case study

The [case study route](../app/[locale]/case-studies/railgun/page.tsx) renders the [page copy](../../../content/pages/en/case-studies-railgun.json) at `/case-studies/railgun`. The Messaging page links to it from the RAILGUN card. The site-wide navigation overlays the cover and adjusts its text colour to the section beneath it.

The [1440px desktop frame](https://www.figma.com/design/MALNxrjLTCy0TA9vaWEwBs/Logos-Designs?node-id=3767-17031) and [393px mobile frame](https://www.figma.com/design/MALNxrjLTCy0TA9vaWEwBs/Logos-Designs?node-id=3777-17120) supply the layout and copy. The [code-layer prototype](https://www.figma.com/proto/MALNxrjLTCy0TA9vaWEwBs/Logos-Designs?node-id=3904-18706) supplies the timing and easing for the cover, section reveals, five-step transaction diagram, stack replay, and closing transition.

Each chapter owns its copy. Where a chapter has a `lineBreaks` entry, update that entry alongside its corresponding text. The authored desktop breaks apply from 1440px. Mobile breaks apply at the 393px reference width and its immediate neighbours. Other sizes wrap to available space. The transaction diagram pins only when its stage fits in the viewport. Its tabs work by click, tap and arrow keys.

The cover uses the prototype's three text-motion groups even when the approved mobile copy wraps onto four lines. The stack replay uses the prototype's packet travel distance across the shorter mobile card gaps. The PriFi timeline contains seven transaction stages, with Ordering followed by a single Settlement. On mobile, the vertical PriFi timeline is visible before the three cards reveal together. On desktop, the three timeline segments draw in sequence.

The Gateway.fm card opens the prototype's preview panel. The page uses the shared footer and newsletter form with the case study's link labels, layout and copy.
