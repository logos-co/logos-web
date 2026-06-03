# /technology-stack/networking — Pending Copy Decisions

Source of truth for the page content: `content/pages/en/technology-stack-networking.json`.

Backup of networking copy items from the latest copy doc that are **still not applied**
because they need a decision, a new field, or a component/schema change. Straight
before/after text swaps and hero structural additions that are already in the JSON are
documented under **Applied** below.

Last updated: 2026-06-03

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

## 1. Feature sections (`networking.features`)

This is the largest open decision. The current JSON renders **three image cards**
(`cardGrid`, title + description + image only, no per-card links):

1. `The Mix-Net`
2. `Capability Discovery Protocol`
3. `Peering Layer`

The new copy replaces these with **three detailed feature sections**, each with a
longer body and its own `REPO →` / `DOCS →` links — matching the `ctaPanel`
pattern the messaging page uses (`messaging.lmn`, `messaging.censorship`). This is
a component/structure change (cardGrid → multiple ctaPanels), not a text swap, so
it is held. The "Peering Layer" card is also repurposed into an RLN / spam-resistance
section.

### 1a. Service Discovery (was "Capability Discovery Protocol")

> How does a node find other nodes offering the services it needs without a
> central directory? Service Discovery answers this with a new protocol built on
> libp2p's Kad-DHT. Each node publishes a signed record describing its address and
> capabilities; others search for matching records through a general API, and light
> clients can look peers up without joining the full distributed hash table. This
> enables a heterogeneous peer-to-peer network where many kinds of node coordinate
> without intermediaries.

- `REPO →` `https://github.com/vacp2p/nim-libp2p`
- `DOCS →` **undefined in source**

### 1b. Mixnet (was "The Mix-Net")

> The mixnet is a privacy-preserving transport mechanism drawn from the same family
> of designs behind anonymity networks such as Tor and Nym.
>
> Messages pass through several relay nodes that shuffle and delay them, so that no
> observer can pair senders with receivers even by watching timing and volume
> closely. It carries both fire-and-forget messages and request-response
> interactions, and it supports cover traffic to keep the set of plausible senders
> large enough to preserve privacy.

- `REPO →` `https://github.com/logos-co/nim-libp2p-mix`
- `DOCS →` **undefined in source**

### 1c. Spam Resistance: RLN and Zerokit (replaces "Peering Layer")

> An anonymous network needs a way to stop abuse without identifying its users.
>
> A Rate Limiting Nullifier (RLN) does exactly that, using zero-knowledge proofs:
> each member can send up to a set rate while staying anonymous, and exceeding that
> rate makes their identity recoverable so the network can remove them.
>
> The cryptography lives in Zerokit, a Rust library containing cryptographic modules
> designed for performance, security, and usability.

- `REPO →` `https://github.com/vacp2p/zerokit`
- `DOCS →` **undefined in source**

**Decision needed:** convert the `cardGrid` to three `ctaPanel` feature sections
(matching messaging) vs. keep the image-card layout? Existing feature images
(`mix-net.jpg`, `capability-discovery.jpg`, `peering-layer.jpg`) — reuse, replace,
or drop? Destinations for the three blank `DOCS →` links.

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
