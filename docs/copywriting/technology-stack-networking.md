# /technology-stack/networking — Pending Copy Decisions

Source of truth for the page content: `content/pages/en/technology-stack-networking.json`.

Backup of networking copy items from the latest copy doc that are **still not applied**
because they need a decision, a new field, or a component/schema change. Straight
before/after text swaps and hero structural additions that are already in the JSON are
documented under **Applied** below.

Last updated: 2026-06-04

---

## Applied

### Hero `bodySecondary`, `items[]`, and `status`

Implemented in `technology-stack-networking.json` (commit `b0b1199`) and rendered via
`NetworkingHero` → `TechStackDetailHero` (taller mobile hero for six repo lines).

| Field | Current value |
|---|---|
| `bodySecondary` | `Key Repositories:` |
| `items[]` | Six repo lines as proposed in the copy doc (titles only, no per-card links) |
| `status.label` | `Current Status` |
| `status.body` | Active development / testnet copy from the doc |
| `status.cta` | `Install testnet`, `variant: secondary`, `iconOverride: download` |

Hero actions:

- `networking.hero.ctas` — Docs only (`https://github.com/logos-co/logos-docs`); redundant
  primary "Use Basecamp" removed (`884f938`). The copy doc’s standalone trailing `DOCS →` in
  the repo list area is covered by this CTA, not a second link under `items[]`.
- `status.cta.href` in JSON is `/technology-stack/networking` (placeholder). At runtime,
  `resolveBasecampInstallCtaLinkProps` in `tech-stack-detail-hero.tsx` resolves install-style
  CTAs with `iconOverride: download` to the Basecamp releases URL.

**Still optional (not blocking publish):** add `href` on each `items[]` entry if repo URLs are
confirmed; replace the placeholder `status.cta.href` in JSON with the resolved external URL
for clarity in content review.

---

## 1. Feature sections (`networking.features`) -- Applied (partial)

The per-card `REPO →` and `DOCS →` links have been added to the existing image-card
layout (keeping `cardGrid`). Cards now render Repo + Docs buttons below the description
text, matching the button style from the messaging ctaPanel sections. Card heights
changed from fixed to `min-h` to accommodate the added buttons.

### Links applied

| Card | Repo | Docs |
|---|---|---|
| The Mix-Net | `https://github.com/logos-co/nim-libp2p-mix` | `https://github.com/logos-co/logos-docs` (fallback) |
| Capability Discovery Protocol | `https://github.com/vacp2p/nim-libp2p` | `https://github.com/logos-co/logos-docs` (fallback) |
| Peering Layer | `https://github.com/vacp2p/zerokit` | `https://github.com/logos-co/logos-docs` (fallback) |

### Still pending

- **Longer body copy** for each card (sections 1a/1b/1c descriptions from the copy doc)
  and the card title renames (Service Discovery, Spam Resistance: RLN and Zerokit) --
  these are copy/text swaps that can be applied directly in the JSON.
- **Per-card DOCS URLs** -- fallback `logos-docs` used for all three; replace when
  specific documentation pages exist.
- **Layout conversion** (cardGrid → ctaPanel) is still an open option if the full
  redesign is wanted; the current approach keeps the image-card layout.

---

## 2. Bottom builder CTAs (`networking.builderCta`)

Current three cards: `Docs` / `Logos Builder Hub` / `Logos App`.

New copy:

- **Docs** — `VIEW THE DOCS →` `https://github.com/logos-co/logos-docs` (matches current)
- **Logos Builder Hub** — `BUILD →` `https://build.logos.co` (current href: `/builders-hub`)
- **Install Basecamp** — `INSTALL →` `https://github.com/logos-co/logos-basecamp/`
  (current card is `Logos App` / `Download` / `/builders-hub#app-install`)

**Decision needed:** rename "Logos App" → "Install Basecamp"? Change the Builder Hub
link to the external `build.logos.co`? The third card’s install CTA may use
`resolveBasecampInstallCtaLinkProps` in `tech-stack-builder-cta.tsx` once labels/hrefs
match the install pattern — confirm intended destination (GitHub repo vs releases)
before changing hrefs.
