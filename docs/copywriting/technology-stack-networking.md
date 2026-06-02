# /technology-stack/networking — Pending Copy Decisions

Source of truth for the page content: `content/pages/en/technology-stack-networking.json`.

Backup of networking copy items from the latest copy doc that were **not yet applied**
because they require a decision, a new field, or a component/schema change.
Everything that was a straight before/after text swap on an existing field has already
been applied to the JSON.

Last updated: 2026-06-02

---

## 1. Hero `bodySecondary` + `items` (Key Repositories)

The new copy adds a "Key Repositories" list to the hero. The messaging page
(networking's sibling) supports `bodySecondary` + `items[]` on the hero, so the
schema can carry this — but it is a structural addition, not a before/after, and
the trailing `DOCS →` link is left blank in the source copy.

Proposed `bodySecondary`: `Key Repositories:`

Proposed `items[]`:

- `VACP2P — Communication and privacy research.`
- `NIM-LIBP2P — Nim implementation of the libp2p networking stack.`
- `LIBLOGOS — Core library for the Logos runtime.`
- `MIX-RLN-SPAM-PROTECTION-PLUGIN — RLN-based spam protection for libp2p mixnets.`
- `ZEROKIT — Zero-knowledge modules for RLN implementation.`
- `DE-MLS — Secure group membership coordinated through off-chain consensus.`

**Decision needed:** add the repo list? Per-repo links (none supplied)? Destination
for the trailing `DOCS →` (blank in source; default would be
`https://github.com/logos-co/logos-docs`).

---

## 2. Hero `status` block (Current Status + Install Testnet)

The new copy adds a "Current Status" block with an "INSTALL TESTNET ↓" CTA. The
messaging hero supports a `status` block (`label` / `body` / `cta` / `secondaryCta`),
so the schema can carry it.

Proposed `status.label`: `Current Status`

Proposed `status.body`:
> The networking layer is in active development toward testnet, with capability
> discovery and the libp2p mixnet as leading priorities. In the future, Service
> Discovery will replace the legacy discovery mechanism inside Logos Messaging.

Proposed `status.cta`: `INSTALL TESTNET` → **link undefined in source**.

**Decision needed:** add the status block? Destination for the Install Testnet CTA.

---

## 3. Feature sections (`networking.features`)

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

### 3a. Service Discovery (was "Capability Discovery Protocol")

> How does a node find other nodes offering the services it needs without a
> central directory? Service Discovery answers this with a new protocol built on
> libp2p's Kad-DHT. Each node publishes a signed record describing its address and
> capabilities; others search for matching records through a general API, and light
> clients can look peers up without joining the full distributed hash table. This
> enables a heterogeneous peer-to-peer network where many kinds of node coordinate
> without intermediaries.

- `REPO →` `https://github.com/vacp2p/nim-libp2p`
- `DOCS →` **undefined in source**

### 3b. Mixnet (was "The Mix-Net")

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

### 3c. Spam Resistance: RLN and Zerokit (replaces "Peering Layer")

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

## 4. Bottom builder CTAs (`networking.builderCta`)

Current three cards: `Docs` / `Logos Builder Hub` / `Logos App`.

New copy:

- **Docs** — `VIEW THE DOCS →` `https://github.com/logos-co/logos-docs` (matches current)
- **Logos Builder Hub** — `BUILD →` `https://build.logos.co` (current href: `/builders-hub`)
- **Install Basecamp** — `INSTALL →` `https://github.com/logos-co/logos-basecamp/`
  (current card is `Logos App` / `Download` / `/builders-hub#app-install`)

**Decision needed:** rename "Logos App" → "Install Basecamp"? Change the Builder Hub
link to the external `build.logos.co`? Basecamp link likely interacts with the
`resolveBasecampInstallCtaLinkProps` resolver (see recent commit 822c9ed) — confirm
before changing hrefs.
