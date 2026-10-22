# @acid-info/logos-tokens

The Logos design tokens as CSS, written as Tailwind v4 `@theme` layers. There is no JavaScript in the package.

Use it in any Tailwind v4 app that needs the Logos look, with or without `@acid-info/logos-ui`.

## Install

```bash
pnpm add @acid-info/logos-tokens
```

## Usage

Import the aggregate file in your Tailwind entry stylesheet:

```css
@import 'tailwindcss';
@import '@acid-info/logos-tokens/theme.css';
```

`theme.css` pulls in all five layers: `colors.css`, `typography.css`, `spacing.css`, `radius.css` and `motion.css`. Colours and typography are filled in. Spacing, radius and motion are still placeholders with a TODO comment, so importing those layers today gives you nothing.

You can import a single layer instead of the aggregate:

```css
@import '@acid-info/logos-tokens/colors.css';
```

If you also use `@acid-info/logos-ui`, import its stylesheet too so Tailwind scans the compiled components:

```css
@import '@acid-info/logos-ui/styles.css';
```
