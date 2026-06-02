# /technology-stack/storage — Pending Copy Decisions

Source of truth for the page content: `content/pages/en/technology-stack-storage.json`.

Only **open decisions** are tracked here. Once a decision is made and applied,
remove it from this file.

---

## 1. Per-module DOCS links → netlify

The new copy points each module's docs CTA at a module-specific URL:

- Storage Module API → `https://logos-storage-docs.netlify.app/api/storage-module/`
- libstorage → `https://logos-storage-docs.netlify.app/tutorials/libstorage/`

The link-policy test `routes Docs and Documentation links to the Logos docs
repository` (`apps/web/lib/__tests__/link-policy.test.ts`) forces **every** link
whose label/title is `docs` / `documentation` / `view the docs` to point to
`https://github.com/logos-co/logos-docs`. These netlify URLs would break it.

**Decision:** relax/extend the link policy to allow per-module docs URLs, or keep
all docs links on the central docs repo? Until decided, all `Docs` / `View the
docs` CTAs remain on `logos-co/logos-docs`.

---

## 2. Hero — primary CTA + testnet install destination

- The new copy shows only `DOCS →` in the hero (no `Try Logos Storage` primary
  CTA). **Decision:** drop the `Try Logos Storage` CTA, or keep it?
- `status.cta.href` ("Install testnet") is still the placeholder
  `/technology-stack/storage`. **Decision:** where should it point?

---

## 3. Bottom CTA row (`storage.builderCta`)

New copy destinations vs. current routing:

| Card | New copy link | Current `href` | Open question |
| --- | --- | --- | --- |
| Logos Builder Hub | `https://build.logos.co` | `/builders-hub` | Internal route vs external host — routing decision |
| Install Basecamp | `https://github.com/logos-co/logos-basecamp/` | `/basecamp` | `/basecamp` is resolved by the Basecamp install CTA resolver (`resolveBasecampInstallCtaHref`); a raw GitHub URL would bypass that policy |

Also: the `Docs` and `Logos Builder Hub` cards still carry lorem-ipsum
`description` text, and the new copy supplies no replacement. **Decision:**
provide descriptions or remove the field.

---

## 4. Use cases (`storage.useCases`)

Two `Sample App 1/2` cards still contain lorem-ipsum copy and placeholder CTAs
(`/technology-stack/storage`). New copy does not cover this section.
**Decision:** real use-case content + destinations needed.
