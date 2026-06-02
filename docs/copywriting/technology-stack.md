# /technology-stack — Pending Copy Decisions

Open decisions for the Technology Stack page. Content source of truth:
`content/pages/en/technology-stack.json`. Once a decision is made and applied,
remove it from this file.

---

## 1. Hero `status` block

The new copy's hero shows only the three CTAs and no "Current Status / Testnet
v0.1" block. The current JSON still has a `status` block.

**Decision needed:** remove or keep the status block?

---

## 2. Logos Basecamp section — CTA links

- `primaryCta` INSTALL: currently `/builders-hub#app-install`; new copy points to
  `https://github.com/logos-co/logos-basecamp/releases/tag/0.1.2`.
- `secondaryCta` LEARN MORE: currently `/basecamp`; new copy points to
  `https://www.youtube.com/@Logos_network`.

**Decision needed:** change the links? May interact with the
`resolveBasecampInstallCtaLinkProps` resolver.

---

## 3. Open Source Repos — rows 02–04 descriptions

The new copy omits the per-repo description lines:

- Logos Messaging — `Logos Messaging (formerly Waku) protocol implementations`
- Logos Storage — `Logos Storage (formerly Codex) protocol implementations`
- Logos Blockchain — `Logos Blockchain protocol implementations`

`description` is optional in the schema.

**Decision needed:** remove these descriptions or keep them?

---

## 4. Use Cases — new 5th card "Secure communications"

The new copy adds a fifth use case:

- title: `Secure communications`
- description: `Resilient, private messaging for coordination in hostile environments.`

Not added yet because each card requires an `image` (src/width/height) and a
`cta.href`.

**Decision needed:** which image and link? (likely the Messaging module).

---

## 5. Section order

The new copy document lists sections in a different visual order (Use Cases
before How Logos Compares; the Logos Basecamp section last). Current JSON order
is preserved per the "keep the UI the same, change only the copy" directive.

**Decision needed:** reorder sections?
