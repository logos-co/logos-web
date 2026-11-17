/**
 * Font loaders for apps/web.
 *
 * The CSS variables below are referenced by @acid-info/logos-tokens typography utilities
 * (e.g. `--font-display` → `var(--next-font-display)` in typography.css).
 *
 * Public Sans, Open Sans, Fira Code and Fira Mono are OFL fonts self-hosted
 * from public/fonts (Latin + Latin Extended subsets). Do not switch back to
 * next/font/google: it fetches Google Fonts during the build, and Google
 * sometimes returns extensionless /l/font?kit= URLs that crash `next build`
 * (vercel/next.js#99114). Regenerate the files with
 * `pnpm --filter web generate:fonts`.
 *
 * Rhymes Display is a commercial font and must be self-hosted. It is left
 * disabled by default so `pnpm dev` / `pnpm build` work without the woff2.
 * To enable:
 *   1. Drop the file at public/fonts/rhymes-display/rhymes-display-regular.woff2
 *      (see apps/web/docs/fonts.md for licensing notes)
 *   2. Uncomment the `rhymesDisplay` block below and add it back to
 *      `fontVariables`. The typography utilities already reference
 *      `var(--next-font-display)`, so the swap is automatic.
 *
 * Until then the Rhymes Display fallback chain in @acid-info/logos-tokens/typography.css
 * falls back to 'Times New Roman' → ui-serif.
 */

import localFont from 'next/font/local'

export const publicSans = localFont({
  src: '../public/fonts/public-sans/public-sans-latin-wght.woff2',
  weight: '400 700',
  style: 'normal',
  display: 'swap',
  variable: '--next-font-sans',
})

export const firaCode = localFont({
  src: '../public/fonts/fira-code/fira-code-latin-wght.woff2',
  weight: '400 600',
  style: 'normal',
  display: 'swap',
  variable: '--next-font-mono',
})

export const firaMono = localFont({
  src: [
    {
      path: '../public/fonts/fira-mono/fira-mono-latin-400.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/fira-mono/fira-mono-latin-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--next-font-mono-body',
})

export const openSans = localFont({
  src: '../public/fonts/open-sans/open-sans-latin-400.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--next-font-article',
})

export const rhymesDisplay = localFont({
  src: [
    {
      path: '../public/fonts/rhymes-display/rhymes-display-regular.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--next-font-display',
  fallback: ['Times New Roman', 'Georgia', 'serif'],
})

export const fontVariables = [
  rhymesDisplay.variable,
  publicSans.variable,
  openSans.variable,
  firaCode.variable,
  firaMono.variable,
].join(' ')
