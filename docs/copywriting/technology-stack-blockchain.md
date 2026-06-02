# /technology-stack/blockchain — Pending Decisions

Backup of blockchain page copy items that were **not yet applied** because they
require a decision (link target, image asset, structural change, or missing copy).
Straight before/after text swaps on existing fields are already live in
`content/pages/en/technology-stack-blockchain.json`.

Last updated: 2026-06-02

---

## 1. Hero — CTA targets

- **`ctas[0]` "Install & Run A Node"**: currently `href: /builders-hub#app-install` (variant `tertiary`). New copy points it to the GitHub quickstart:
  `https://github.com/logos-co/logos-docs/blob/main/docs/blockchain/quickstart-guide-for-the-logos-blockchain-node.md`.
- **`ctas[1]` "Docs"**: currently `href: https://github.com/logos-co/logos-docs`. New copy left the DOCS URL **blank**.

**Decision needed:** repoint "Install & Run A Node" to the quickstart URL, and
confirm the Docs target. The install CTA may interact with the basecamp/release-link resolvers.

---

## 2. Current Status — CTA href

`cta.href` is the self-referencing placeholder `/technology-stack/blockchain`.
New copy shows `INSTALL TESTNET ↓` (an in-page scroll/anchor to an install section).

**Decision needed:** what anchor/target should this point to.

---

## 3. Feature card "Blend Network" — image

The card (formerly Mantle Channels) still uses `image.src: /images/blockchain/overview/lez.webp`,
the original Mantle Channels artwork. It likely needs a Blend-specific image.

**Decision needed:** which image for the Blend Network card.

---

## 4. Feature cards — per-card REPO / DOCS links

Each of the three cards shows `REPO →` and `DOCS →` with **blank** URLs in the new copy.
Current JSON uses placeholder hrefs (`cta` "Repo" → `/technology-stack/blockchain`;
`secondaryCta` "Docs" → `https://github.com/logos-co/logos-docs`).

**Decision needed:** real repo/docs URLs for each of the three cards.

---

## 5. Feature cards — section heading

The cardGrid section header is `eyebrow: "Cryptarchia"`, `heading: "Cryptarchia:"`,
`subheading: "A private proof-of-stake consensus mechanism where validator
identities and stake amounts remain hidden."` This reads oddly because the section
now contains three cards (Cryptarchia, LEZ, Blend Network), not just Cryptarchia.
The new copy labels this group only as "FEATURE CARDS" and gives no replacement heading.

**Decision needed:** rename/neutralise the section heading.

---

## 6. Builder CTA cards (`blockchain.builderCta`) — copy + links

New copy bottom block:

```text
Docs               VIEW THE DOCS → https://github.com/logos-co/logos-docs
Logos Builder Hub  BUILD →         https://build.logos.co
Install Basecamp   INSTALL →       https://github.com/logos-co/logos-basecamp/
```

Current JSON:

| Card | `description` | `cta` (label → href) |
|---|---|---|
| Docs | `Lorem ipsum dolor sit amet consectetur` | `View the docs` → `https://github.com/logos-co/logos-docs` |
| Logos Builder Hub | `Lorem ipsum dolor sit amet consectetur. Augue feugiat dictum aliquet feugiat.` | `Build` → `/builders-hub` |
| Install Basecamp | `Download the app to start building.` | `Install` → `/basecamp` |

**Decision needed:**
1. **Descriptions** — new copy provides no body text, so the lorem ipsum on Docs and
   Logos Builder Hub cannot be replaced yet. Supply real descriptions (or drop them)?
2. **Links** — repoint `Build` to `https://build.logos.co` (currently `/builders-hub`)
   and `Install` to `https://github.com/logos-co/logos-basecamp/` (currently `/basecamp`)?
   The basecamp install link is resolver-driven.

---

## 7. Related Articles (`blockchain.relatedArticles`) — out of scope / still placeholder

The new copy does not cover this section. It still carries `Lorem ipsum`
`label` / `mobileLabel` placeholders. Needs real copy when scoped.
