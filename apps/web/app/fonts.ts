/**
 * Font loaders for apps/web.
 *
 * The CSS variables below are referenced by @acid-info/logos-tokens typography utilities
 * (e.g. `--font-display` → `var(--next-font-display)` in typography.css).
 *
 * Public Sans and Fira Code are loaded from Google Fonts via next/font/google.
 *
 * Rhymes Display is a commercial font and must be self-hosted. It is left
 * disabled by default so `pnpm dev` / `pnpm build` work without the woff2.
 * To enable:
 *   1. Drop the file at public/fonts/rhymes-display/rhymes-display-regular.woff2
 *      (see apps/web/public/fonts/README.md for licensing notes)
 *   2. Uncomment the `rhymesDisplay` block below and add it back to
 *      `fontVariables`. The typography utilities already reference
 *      `var(--next-font-display)`, so the swap is automatic.
 *
 * Until then the Rhymes Display fallback chain in @acid-info/logos-tokens/typography.css
 * falls back to 'Times New Roman' → ui-serif.
 */

import { Fira_Code, Fira_Mono, Public_Sans } from 'next/font/google'
import localFont from 'next/font/local'

export const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--next-font-sans',
})

export const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--next-font-mono',
})

export const firaMono = Fira_Mono({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--next-font-mono-body',
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
  firaCode.variable,
  firaMono.variable,
].join(' ')
