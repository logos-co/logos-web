/**
 * @figma-node  1484:11139 (desktop Take Action)
 *              1484:10638 (desktop Explore)
 *              1484:10816 (desktop Technology)
 *              1484:10980 (desktop Research)
 *              1484:10314 (mobile root)
 *              1484:10334, 1484:10377, 1484:10414, 1484:10438 (mobile panels)
 *
 * Site header = fixed 40px top bar + <NavOverlay> (dialog from @acid-info/logos-ui).
 * The overlay is a shared primitive — this server component owns the data
 * pipeline (loader → mapped UI props) and hands everything off to the client
 * shell that owns the interactivity.
 */
import Image from 'next/image'
import { getNavigationContent } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type {
  NavOverlayCommunityCard,
  NavOverlayLink,
  NavOverlayMenuPanel,
  NavOverlaySection,
} from '@acid-info/logos-ui'

import SiteHeaderClient from './site-header-client'

export default async function SiteHeader({ locale }: { locale: string }) {
  if (!isActiveLocale(locale)) {
    throw new Error(`SiteHeader received non-active locale "${locale}"`)
  }
  const navigation = await getNavigationContent(locale)

  const sitemap: NavOverlayLink[] = navigation.sitemap

  const mapCard = (card: {
    label: string
    href: string
    description: string
    ctaLabel?: string
    image: { src: string; alt: string }
  }): NavOverlayCommunityCard => ({
    label: card.label,
    href: card.href,
    description: card.description,
    ctaLabel: card.ctaLabel,
    image: (
      <Image
        src={card.image.src}
        alt={card.image.alt}
        fill
        sizes="(max-width: 768px) 42px, 226px"
      />
    ),
  })

  const community: NavOverlayCommunityCard[] = navigation.communityCards.map(
    (card) => mapCard(card)
  )

  const menuPanels: NavOverlayMenuPanel[] = navigation.menuPanels.map(
    (panel) => ({
      label: panel.label,
      textSections: panel.textSections as NavOverlaySection[],
      actionCards: panel.actionCards.map(mapCard),
      cardSections: panel.cardSections.map((section) => ({
        label: section.label,
        cards: section.cards.map(mapCard),
      })),
    })
  )

  return (
    <SiteHeaderClient
      closedBar={navigation.closedBar}
      sitemap={sitemap}
      community={community}
      menuPanels={menuPanels}
      primaryCta={navigation.primaryCta}
    />
  )
}
