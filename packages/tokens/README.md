# @acid-info/logos-tokens

Logos design tokens as CSS imports. CSS-only. No JavaScript runtime.

Use this package with `@acid-info/logos-ui` or in any Tailwind v4 app that needs
the Logos color, typography, spacing, radius, and motion tokens.

## Install

```bash
pnpm add @acid-info/logos-tokens
```

```bash
npm install @acid-info/logos-tokens
```

## Usage

In your Tailwind entry stylesheet:

```css
@import 'tailwindcss';
@import '@acid-info/logos-tokens/theme.css';
```

If you also use `@acid-info/logos-ui`, include the UI package in Tailwind's
source scan:

```css
@import '@acid-info/logos-ui/styles.css';
```

Individual layers are also exported if you need a subset:

- `@acid-info/logos-tokens/colors.css`
- `@acid-info/logos-tokens/typography.css`
- `@acid-info/logos-tokens/spacing.css`
- `@acid-info/logos-tokens/radius.css`
- `@acid-info/logos-tokens/motion.css`

## Notes

The default `theme.css` file imports every token layer. Use the individual CSS
exports only when you need a smaller subset.
