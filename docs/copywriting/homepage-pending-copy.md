# Homepage Copy — Pending Decisions

Backup of homepage copy items from the latest copy doc that were **not yet applied**
because they require a decision, a new field, or a component/schema change.
Everything that was a straight before/after text swap on an existing field has already
been applied to `apps/web/messages/en.json` and `content/pages/en/home.json`.

Last updated: 2026-06-02

---

## 1. Social Proof — section caption (placement undecided)

The 4 stat cards (Total contributions / Active contributors / Repositories / Circles)
stay as-is. The copy doc adds one caption line, but where it attaches is undecided —
either a new section-level caption or a replacement for the Circles card body.

> Local issues that Circles identify and solve – from privacy tech to community funding.

- Source field today: `home.socialProof.circles.body` = "Local chapters of activists and change seekers solving real world issues."
- **Decision needed:** new caption element vs. replace the Circles card body.

---

## 2. Tech Stack — supporting copy with no existing field (structural)

The copy doc adds three things the current `techStackOverview` component/schema does not render:

### 2a. Subheadline (new)
> Private-by-default infrastructure for people who need secure coordination and do not trust existing platforms to provide it.

### 2b. Disclaimer (new)
> Abstract representation of the stack.

### 2c. Top CTAs — expand from 1 to 3 (new)
Current: single CTA "See the Stack" → `https://github.com/logos-co/logos-docs`.
Copy doc wants three:
- EXPLORE THE STACK → `/technology-stack`
- START BUILDING → `/builders-hub`
- DOCUMENTATION → `https://github.com/logos-co/logos-docs`

**Decision needed:** add fields to the `TechStackOverviewSection` schema + render them in
`apps/web/components/sections/home/tech-stack-section.tsx`. Not a copy-only change.

---

## 3. Tech Stack — undecided "LEARN MORE" links

Copy doc marks two module links as `[?]`:
- **User Modules** — "LEARN MORE → [?]" (current `href`: `/basecamp`)
- **The Foundation: Logos Runtime** — "LEARN MORE → [?]" (currently no link rendered)

**Decision needed:** destination URLs.

---

## 4. Meta description — hyphenation

Applied verbatim from the copy doc as:
> Private-by default technology to reclaim civil society. Logos is the decentralised infrastructure for building parallel systems.

The doc writes "Private-by default" (no second hyphen) while the rest of the site uses
"private-by-default". **Decision needed:** keep verbatim or normalise to "Private-by-default".

---

## 5. "Start a Circle" CTA — href

In the "Take Action / Join a Circle" section, the copy doc leaves START A CIRCLE → `[?]`.
Current `home.circlesCta.secondaryCta.href` = `/circles`.

**Decision needed:** confirm `/circles` or provide a dedicated route.
