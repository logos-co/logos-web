# @acid-info/logos-ui

Shared Logos React primitives and SVG icons: the Logos mark and wordmark, `Button`, `Card`, `Footer`, `NavOverlay`, `Pagination`, the table and view-toggle controls from Builders Hub, a headless city autocomplete hook, and the podcast, search and share icons.

## Install

```bash
pnpm add @acid-info/logos-ui @acid-info/logos-tokens
```

`react` (18.3+ or 19) is a peer dependency. `@acid-info/logos-tokens` is an optional peer, but in practice you want it: the components are styled with the Logos Tailwind tokens.

## Styles

Import the tokens and the package stylesheet in your Tailwind v4 entry stylesheet:

```css
@import 'tailwindcss';
@import '@acid-info/logos-tokens/theme.css';
@import '@acid-info/logos-ui/styles.css';
```

The stylesheet is one line, `@source './dist'`. It makes Tailwind scan the package's compiled files, which it does not do for `node_modules` by default, so leaving it out gives you unstyled components. The package injects no global CSS.

## Usage

```tsx
import { Button, LogosMark } from '@acid-info/logos-ui'

export function HeaderAction() {
  return (
    <div className="flex items-center gap-3 text-brand-dark-green">
      <LogosMark size={24} />
      <Button
        href="https://free.technology/jobs"
        target="_blank"
        rel="noopener noreferrer"
        variant="secondary"
      >
        Work with us
      </Button>
    </div>
  )
}
```

## Linking to your router

`Button` and `Card` take a `linkAs` prop for any component that accepts an anchor's props, such as `next/link`, so internal links stay client-side routed:

```tsx
import Link from 'next/link'
import { Button } from '@acid-info/logos-ui'

<Button href="/about" linkAs={Link}>
  About
</Button>
```

## Entrypoints

`@acid-info/logos-ui` is the root entrypoint with server-safe components and their types, including `Button`, `ButtonArrowIcon`, `Card`, `CardInfo`, `Footer`, `GiantSwitch`, `GiantSwitchTag`, `IconButton`, `Pagination`, `Table`, `TableRow`, `ViewToggle`, the technology-stack sections and the icons.

`@acid-info/logos-ui/client` holds the components that need React effects and are marked `'use client'`: `NavOverlay` and `FooterNewsletter`. Import them from there, otherwise a server component will fail to build.

It also exports `useCityAutocomplete`, the headless city combobox behind `FooterNewsletter`'s `searchCities` prop, with its `CitySearch`, `CitySuggestion` and `UseCityAutocompleteOptions` types and the `CITY_SEARCH_MIN_LENGTH` and `CITY_SEARCH_DEBOUNCE_MS` constants. You pass a `CitySearch` function and render the list yourself; [docs/components.md](../../docs/components.md#newsletter-form) describes how it behaves.

`@acid-info/logos-ui/styles.css` is the stylesheet described above. The full export list is in `src/index.ts` and `src/client.ts`.
