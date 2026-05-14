import type { CollectionConfig } from 'payload'

import {
  authenticatedCollectionAccess,
  createSlugField,
  recentPrAdminComponents,
} from './shared-fields'
import { createChangePullRequestHook } from './content-pr-hooks'
import {
  saveSiteFooterAsPullRequest,
  saveSiteNavigationAsPullRequest,
  saveSiteSettingsAsPullRequest,
  type SiteFooterDocLike,
  type SiteNavigationDocLike,
  type SiteSettingsDocLike,
} from '@/services/content-workflow'

const noDeleteAccess: CollectionConfig['access'] = {
  ...authenticatedCollectionAccess,
  delete: () => false,
}

export const SiteSettingsContent: CollectionConfig = {
  slug: 'site-settings-content',
  admin: {
    components: recentPrAdminComponents,
    defaultColumns: ['slug', 'updatedAt'],
    useAsTitle: 'slug',
    description:
      'Repo-backed site settings. Saving validates and writes content/site/en/settings.json through a GitHub pull request.',
  },
  access: noDeleteAccess,
  hooks: {
    beforeChange: [
      createChangePullRequestHook<SiteSettingsDocLike>({
        save: saveSiteSettingsAsPullRequest,
      }),
    ],
  },
  fields: [
    createSlugField('Use "settings".'),
    {
      name: 'settings',
      type: 'json',
      required: true,
      admin: { description: 'Must match @repo/content siteSettingsSchema.' },
    },
  ],
  timestamps: true,
}

export const SiteNavigationContent: CollectionConfig = {
  slug: 'site-navigation-content',
  admin: {
    components: recentPrAdminComponents,
    defaultColumns: ['slug', 'updatedAt'],
    useAsTitle: 'slug',
    description:
      'Repo-backed site navigation. Saving validates and writes content/site/en/navigation.json through a GitHub pull request.',
  },
  access: noDeleteAccess,
  hooks: {
    beforeChange: [
      createChangePullRequestHook<SiteNavigationDocLike>({
        save: saveSiteNavigationAsPullRequest,
      }),
    ],
  },
  fields: [
    createSlugField('Use "navigation".'),
    {
      name: 'navigation',
      type: 'json',
      required: true,
      admin: { description: 'Must match @repo/content navigationSchema.' },
    },
  ],
  timestamps: true,
}

export const SiteFooterContent: CollectionConfig = {
  slug: 'site-footer-content',
  admin: {
    components: recentPrAdminComponents,
    defaultColumns: ['slug', 'updatedAt'],
    useAsTitle: 'slug',
    description:
      'Repo-backed site footer. Saving validates and writes content/site/en/footer.json through a GitHub pull request.',
  },
  access: noDeleteAccess,
  hooks: {
    beforeChange: [
      createChangePullRequestHook<SiteFooterDocLike>({
        save: saveSiteFooterAsPullRequest,
      }),
    ],
  },
  fields: [
    createSlugField('Use "footer".'),
    {
      name: 'footer',
      type: 'json',
      required: true,
      admin: { description: 'Must match @repo/content footerSchema.' },
    },
  ],
  timestamps: true,
}
