/**
 * /design-systems — 1:1 mirror of Figma frames for visual review.
 *
 * Section components live in `_sections/` so this page reads as a manifest:
 *   - color-palette.tsx → ColorPalette  (Figma node 40009046:20492)
 *   - type-styles.tsx   → TypeStyles    (Figma node 40009046:20537)
 *   - components.tsx    → Cards / Buttons / Tables / GiantSwitches /
 *                         ViewToggles / Paginations / Footers
 */
import { createDefaultMetadata } from '@/utils/metadata'

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
    path: '/design-systems',
  })
}

export default function DesignSystemsPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-[40px] py-10">
      <ColorPalette />
      <TypeStyles />
      <Cards />
      <Buttons />
      <Tables />
      <GiantSwitches />
      <ViewToggles />
      <Paginations />
      <Footers />
    </div>
  )
}
