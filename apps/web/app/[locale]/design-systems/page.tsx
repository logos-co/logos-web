/**
 * /design-systems — 1:1 mirror of Figma frames for visual review.
 *
 * Section components live in `_sections/` so this page reads as a manifest:
 *   - color-palette.tsx → ColorPalette  (Figma node 40009046:20492)
 *   - type-styles.tsx   → TypeStyles    (Figma node 40009046:20537)
 *   - components.tsx    → Cards / Buttons / Tables / GiantSwitches /
 *                         ViewToggles / Paginations / Footers
 */
import { isActiveLocale } from '@repo/content/locales'

import { createDefaultMetadata } from '@/lib/metadata'

import { ColorPalette } from './_sections/color-palette'
import {
  Buttons,
  Cards,
  Footers,
  GiantSwitches,
  Paginations,
  Tables,
  ViewToggles,
} from './_sections/components'
import { TypeStyles } from './_sections/type-styles'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return createDefaultMetadata({
    title: 'Design System',
    description:
      'Logos design tokens — Color Palette and Type Styles mirrored from Figma.',
    locale,
    noindex: true,
    path: '/design-systems',
  })
}

export default async function DesignSystemsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`DesignSystemsPage received non-active locale "${locale}"`)
  }

  return (
    <div className="flex w-full flex-col gap-10 py-10">
      <ColorPalette />
      <TypeStyles />
      <Cards locale={locale} />
      <Buttons />
      <Tables />
      <GiantSwitches />
      <ViewToggles />
      <Paginations />
      <Footers />
    </div>
  )
}
