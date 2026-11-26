# Logos Node Referral Programme

The temporary [`/logos-node-referral-programme` page](../app/[locale]/logos-node-referral-programme/page.tsx) reads its signup, Basecamp preparation links and FAQ copy from [`content/pages/en/logos-node-referral-programme.json`](../../../content/pages/en/logos-node-referral-programme.json).

The page has a photo hero, an email-only update form, a Discord link, Basecamp installation links and eight FAQ accordions. The first answer starts expanded. Opening another question closes the previous answer; the native details elements also work without JavaScript. The site header and footer remain shared.

The form uses the existing site newsletter through [`submitNodeProgrammeSignup`](../app/[locale]/logos-node-referral-programme/node-programme-signup.ts), with `Source: Node programme` in the note. It does not create referral links, track invites or calculate rewards. Email validation, pending, success and retry states are handled by the form.

Basecamp installation reuses the platform download resolver. The displayed Basecamp version comes from the release snapshot refreshed during each build. The testnet version and FAQ dates remain editorial content: update them when a release or roadmap change is confirmed. Do not publish internal release reminders as page copy.

FAQ links include the roadmap, node requirements, Discord invite and the choose-your-path and node-operators channels. The general testnet FAQ link opens the existing `/testnet-faqs` page.

This is a standalone page. The existing `/node-programme` route, content and signup form are unchanged. The page uses the full viewport width with 12px outer gutters, including on 4K displays.

CTA feedback matches the Railgun case study: a 3px arrow movement over 200ms, 140ms colour feedback and a 0.97 press scale over 90ms. The page reuses the shared case study content reveals. Reduced-motion preferences disable the movement and reveals, including preference changes while the page is open.
