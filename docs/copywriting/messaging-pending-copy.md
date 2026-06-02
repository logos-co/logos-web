# Messaging Page Copy — Pending Decisions

Page: `/technology-stack/messaging` — source: `content/pages/en/technology-stack-messaging.json`.

Backup of items from the latest copy doc that were **not yet applied** because they
need a decision (link target, structure change, or replacement copy). Straight
before/after text swaps on existing fields have already been applied.

Last updated: 2026-06-02

---

## 1. Hero — "Key Repositories" item name casing

Copy doc renders the two repo names in uppercase; current values are mixed-case.

| Field | Current | Copy doc |
|---|---|---|
| `messaging.hero.items[0].title` | `Logos-delivery — Peer-to-peer transport layer with spam protection.` | `LOGOS-DELIVERY — ...` |
| `messaging.hero.items[1].title` | `logos-chat — Library for private, end-to-end encrypted p2p chat.` | `LOGOS-CHAT — ...` |

Descriptions are identical; only the repo-name casing differs (and current casing is
already inconsistent). **Decision needed:** normalise to uppercase, or treat as CSS styling.

---

## 2. Hero — CTAs and status secondary CTA (structural)

Copy doc's hero/status area shows only `DOCS →` and `INSTALL TESTNET ↓`. The current
hero has extra actions not present in the doc:

- `messaging.hero.ctas[0]` = "use messaging sdk" (primary) → not in copy doc. Remove?
- `messaging.hero.status.secondaryCta` = "READ MORE" → not in copy doc. Remove?
- `messaging.hero.status.cta.href` = `/technology-stack/messaging` (self-link placeholder).
  Copy doc's "INSTALL TESTNET ↓" implies a scroll-to-section anchor. **Target undecided.**

Applied already: status CTA label `Install testnet v0.1` → `Install testnet` (version dropped,
consistent with the status body).

---

## 3. Feature cards — REPO link targets (confirm repos are live)

Copy doc gives new repo URLs. Current links point to existing repos; do not switch until
the new repos are confirmed live (avoid 404s).

| Card | Current `cta.href` | Copy doc REPO |
|---|---|---|
| Delivery (`messaging.lmn`) | `https://github.com/waku-org/nwaku` | `https://github.com/logos-messaging/logos-delivery` |
| Chat (`messaging.censorship`) | `https://github.com/logos-co/logos-chat-module` | `https://github.com/logos-messaging/logos-chat` |

The "DOCS →" links in the copy doc have no URL specified; current `secondaryCta.href`
(logos-co/logos-docs) was kept.

---

## 4. Lorem ipsum placeholders with no replacement copy

The copy doc does not supply replacement text for these, so they were left as-is:

- `messaging.caseStudies.subheading` = "Lorem ipsum dolor sit amet consectetur. Dignissim mattis ut pulvinar massa."
- `messaging.builderCta.cards[0].description` (Docs) = "Lorem ipsum dolor sit amet consectetur"
- `messaging.builderCta.cards[1].description` (Logos Builder Hub) = "Lorem ipsum dolor sit amet consectetur. Augue feugiat dictum aliquet feugiat."
- `messaging.relatedArticles.label` = "Lorem ipsum dolor si amet"

**Decision needed:** provide copy or remove the fields.

---

## 5. Bottom CTA links — internal vs external routing

Copy doc points these to external URLs; current values are internal routes. Switching
internal→external affects nav consistency and link-policy tests, so deferred.

| Card | Current `cta.href` | Copy doc |
|---|---|---|
| Logos Builder Hub | `/builders-hub` | `https://build.logos.co` |
| Install Basecamp | `/basecamp` | `https://github.com/logos-co/logos-basecamp/` |

(Docs card already points to `https://github.com/logos-co/logos-docs`, matching the doc.)
