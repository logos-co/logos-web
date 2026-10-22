# Design system

How the demos must look and read. Code:
[`src/app/globals.css`](../src/app/globals.css),
[`packages/tokens`](../../../packages/tokens) and
[`packages/ui`](../../../packages/ui).

Every demo uses the Logos design system. A demo that looks unlike logos.co is a
bug, however well it works.

## Nothing below 14px, and no size literals

The shared tokens include three 12px utilities: `text-eyebrow`, `text-mono-s`
and `text-caption-sans`. Don't use them here. For those roles this app defines
`text-label` and `text-mono-body` in `globals.css`, and `text-body-sans` is
already 14px.

Never write a font size as a literal, in CSS or as `text-[15px]`. Sizes come
from Tailwind's scale: `var(--text-sm)`, `var(--text-base)`, `var(--text-lg)`,
`var(--text-xl)`.

We don't change the tokens to get there, because logos.co uses them too. The
same goes for shared components that set their own sizes: `Button` in
`packages/ui` renders its label at `text-xs` (12px), so `globals.css` raises
`.text-xs` to `var(--text-sm)` for this app only. That rule is unlayered so it
outranks the Tailwind utility it overrides.

## Components

Use the components from `@acid-info/logos-ui`: `Button`, `Card`, `Table`, the
icon set and `LogosMark`. If a primitive is missing, add it to `packages/ui`
instead of writing a local one. Demos import the design system; they don't
restyle from scratch.

## Typography

Use the type utilities from `packages/tokens`: `text-hero`, `text-h1`,
`text-h2`, `text-h3-serif`, `text-h4-serif`, `text-card-title-serif`,
`text-subhead-serif`, `text-body-serif`, `text-h3-sans`, `text-h4-sans`,
`text-subhead-sans` and `text-body-sans`, plus this app's `text-label` and
`text-mono-body`. Never set a font size or line height directly.

## Colours

Use the colour utilities, such as `bg-brand-dark-green`,
`text-brand-off-white`, `text-gray-05`, `border-gray-01` and
`bg-accent-light-blue`; the full palette is in
[`packages/tokens/src/colors.css`](../../../packages/tokens/src/colors.css).
Never inline a hex value or put a raw `var(--color-...)` in a className.

Every clickable element needs `cursor-pointer` in its className. The `Button`
primitive doesn't add it.

## Copy

No em dashes anywhere: page titles, body copy, explainers, docs, code comments.
Use a comma, a colon or a full stop, or split the sentence. Don't use a long
dash to stand for a missing value either; say what is missing (`not reported`,
`none`).

Names follow logos.co. The stack area is Logos Messaging, and its modules are
Delivery and Chat. Never write "Waku" in copy a visitor sees. Library names and
code identifiers (`@waku/sdk`, `use-waku-node.ts`) keep their own names. See
[logos-stack.md](logos-stack.md).

Demo copy is hardcoded in components and doesn't go through `next-intl`; this
app is exempt from the repo-wide i18n rule. The demos are single-locale
explanatory pages, and their wording is tied to the behaviour they show. If a
demo ever ships in more than one language, move its copy to `next-intl` then.

Copy is British English, and committed files are English only.
