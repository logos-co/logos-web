import { assertActiveLocale } from '../locales/registry'
import {
  type Footer,
  type Language,
  type Navigation,
  type SiteSettings,
  footerSchema,
  navigationSchema,
  siteSettingsSchema,
} from '../schemas/index'

import { contentPath, readJson } from './_fs'
import {
  type PressArticle,
  DEFAULT_PRESS_VISIBLE_COUNT,
  resolvePressList,
} from './press'

const SITE_DIR = 'site'

/**
 * Navigation enriched with the resolved Press article list. Surface code
 * never resolves slugs itself — the loader does it once per build.
 */
export type NavigationViewModel = Omit<Navigation, 'press'> & {
  press: {
    label: string
    seeAllLabel: string
    seeAllHref: string
    articles: PressArticle[]
  }
}

export const getSiteSettings = async (
  locale: Language
): Promise<SiteSettings> => {
  assertActiveLocale(locale)
  return readJson(
    contentPath(SITE_DIR, locale, 'settings.json'),
    siteSettingsSchema
  )
}

export const getFooter = async (locale: Language): Promise<Footer> => {
  assertActiveLocale(locale)
  return readJson(contentPath(SITE_DIR, locale, 'footer.json'), footerSchema)
}

export const getNavigationContent = async (
  locale: Language
): Promise<Navigation> => {
  assertActiveLocale(locale)
  return readJson(
    contentPath(SITE_DIR, locale, 'navigation.json'),
    navigationSchema
  )
}

export const getNavigation = async (
  locale: Language
): Promise<NavigationViewModel> => {
  const navigation = await getNavigationContent(locale)

  const limit = navigation.press.visibleCount ?? DEFAULT_PRESS_VISIBLE_COUNT
  const articles = await resolvePressList(navigation.press.pinnedSlugs, {
    limit,
    locale,
  })

  return {
    ...navigation,
    press: {
      label: navigation.press.label,
      seeAllLabel: navigation.press.seeAllLabel,
      seeAllHref: navigation.press.seeAllHref,
      articles,
    },
  }
}
