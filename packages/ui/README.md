# @acid-info/logos-ui

Shared Logos React primitives and SVG icons.

This package contains reusable UI components used by Logos web surfaces,
including `<LogosMark />`, `<Button />`, `<Card />`, `<Footer />`,
`<NavOverlay />`, `<Pagination />`, and table/view controls.

## Install

```bash
pnpm add @acid-info/logos-ui @acid-info/logos-tokens
```

```bash
npm install @acid-info/logos-ui @acid-info/logos-tokens
```

`react` is a peer dependency. Install it in your app if it is not already
present.

## Styles

The components use Logos Tailwind utility classes and expect the Logos token
CSS to be imported by the consuming app.

For Tailwind v4, import the token package in your app stylesheet:

```css
@import 'tailwindcss';
@import '@acid-info/logos-tokens/theme.css';
@import '@acid-info/logos-ui/styles.css';
```

The UI stylesheet registers the package's compiled component files as Tailwind
sources. This is required because Tailwind does not scan `node_modules` by
default.

The React package does not inject global CSS by itself.

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

## Link Components

Components that render internal links accept a `linkAs` prop for framework
routers such as Next.js or `next-intl`.

```tsx
import Link from 'next/link'
import { Button } from '@acid-info/logos-ui'

export function LocalizedButton() {
  return (
    <Button href="/about" linkAs={Link}>
      About
    </Button>
  )
}
```

## Exports

All public components and types are exported from the package root:

```tsx
import {
  Button,
  ButtonArrowIcon,
  Card,
  Footer,
  GiantSwitch,
  IconButton,
  LogosMark,
  NavOverlay,
  Pagination,
  Table,
  ViewToggle,
  XIcon,
} from '@acid-info/logos-ui'
```

Client-only components that use React effects are exported from the client
entrypoint:

```tsx
import { NavOverlay } from '@acid-info/logos-ui/client'
```
