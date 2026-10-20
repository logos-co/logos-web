# Design system

How demos in `apps/logos-demos` must look and read. Every demo uses the existing
Logos design system; a demo that looks unlike logos.co is a bug, however well it
works. Code covered: `src/app/globals.css`, `packages/tokens`, `packages/ui`.

## Nothing below 14px, and no size literals

The shared tokens in `packages/tokens` include 12px steps (`text-eyebrow`,
`text-mono-s`, `text-caption-sans`). Do not use them here. This app defines
`text-label` and `text-mono-body` in `globals.css` for those roles, and
`text-body-sans` is already 14px.

Never write a font size as a literal, in CSS or as `text-[15px]`. Sizes come
from Tailwind's scale (`var(--text-sm)`, `var(--text-base)`, `var(--text-lg)`,
`var(--text-xl)`).

The tokens are not changed to fix this, because logos.co uses them too. Shared
components set their own sizes: `Button` in `packages/ui` renders its label at
`text-xs` (12px), so `globals.css` raises `.text-xs` to `var(--text-sm)` for
this app only, unlayered so it outranks the utility it is raising.

## Components

Components come from `@acid-info/logos-ui`: `Button`, `Card`, `Table`, the icon
set, `LogosMark`. If a primitive is missing, add it to `packages/ui` rather than
writing a local one. A demo imports the design system; it does not restyle from
scratch.

## Typography

Use the token utilities from `packages/tokens`: `text-hero`, `text-h1`,
`text-h2`, `text-h3-serif`, `text-h4-serif`, `text-card-title-serif`,
`text-subhead-serif`, `text-body-serif`, `text-h3-sans`, `text-h4-sans`,
`text-subhead-sans`, `text-body-sans`, `text-caption-sans`, `text-eyebrow`,
`text-mono-s`. Never set a font size or line height directly.

## Colours

Use the token utilities: `bg-brand-dark-green`, `text-brand-off-white`,
`text-gray-05`, `border-gray-01`, `bg-accent-light-blue`, and the rest of the
palette in `packages/tokens/src/colors.css`. Never inline a hex value, and never
put a raw `var(--color-...)` in a className.

Every clickable element keeps `cursor-pointer` in its className; the `Button`
primitive does not add it.

## Copy

No em dashes anywhere: page titles, body copy, explainers, docs, code comments.
Use a comma, a colon, a full stop, or split the sentence. A long dash used to
stand in for a missing value is also out: say what is missing (`not reported`,
`none`).

Naming follows logos.co: the stack area is **Logos Messaging**, with **Delivery**
and **Chat** as its modules. Never write "Waku" in visitor-facing copy. Library
names and code identifiers (`@waku/sdk`, `use-waku-node.ts`) keep their own
names. See [logos-stack.md](logos-stack.md).

Demo copy is hardcoded in components, not routed through `next-intl`, and this
app is exempt from the repo-wide i18n rule. The demos are single-locale
explanatory pages whose wording is inseparable from the behaviour being
demonstrated. If a demo ever ships in more than one language, move that demo's
copy to `next-intl` at that point.

Copy is British English and English-only in committed files.
