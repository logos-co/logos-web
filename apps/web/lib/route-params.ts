/**
 * Shared types and helpers for App Router page parameters.
 *
 * Next.js 15 made `params` a Promise on every page; the resulting type
 * (`{ params: Promise<{ locale: string }> }`) appears in 40+ places. Centralising
 * it removes the repetition and gives us one place to add new params shapes.
 *
 * Likewise the `if (!isActiveLocale(locale)) throw new Error(...)` guard repeats
 * 22 times; `resolveLocale` collapses it to a single line.
 */
import { isActiveLocale } from '@repo/content/locales'
import type { Language } from '@repo/content/schemas'

export type LocaleParams = { params: Promise<{ locale: string }> }

export type LocaleSlugParams = {
  params: Promise<{ locale: string; slug: string }>
}

/**
 * Resolve and assert the active locale from a route's `params` Promise.
 *
 * Replaces:
 *   const { locale } = await params
 *   if (!isActiveLocale(locale)) {
 *     throw new Error(`PressPage received non-active locale "${locale}"`)
 *   }
 *
 * @param params    The `params` Promise from a Next.js App Router page.
 * @param pageName  Identifier surfaced in the error message — keep it the same
 *                  string the page used before (e.g. `"PressPage"`) so existing
 *                  log alerts continue to match.
 */
export async function resolveLocale(
  params: Promise<{ locale: string }>,
  pageName: string,
): Promise<Language> {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`${pageName} received non-active locale "${locale}"`)
  }
  return locale
}
