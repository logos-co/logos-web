import type { CollectionConfig } from 'payload'

/**
 * Editor-facing collection for Builders Hub RFPs.
 *
 * Backing store: Payload's Postgres database. Editors create / edit RFP drafts
 * here; the published copy lives in the Git repository under
 * `content/builders-hub/rfps/<slug>/{index,en}.json` and is rendered by the
 * web app's loader.
 *
 * The bridge between the two is the workflow service: clicking
 * "Create PR" on an Rfp row calls `saveAsPullRequest`, which writes the JSON
 * fixtures to a fresh `content/...` branch and opens a pull request. The
 * draft stays in Payload until the PR merges; on merge the loader reflects
 * the change automatically (next deploy / next-revalidate).
 *
 * Field shape mirrors the RFPIndex + RFPLocale Zod schemas in
 * `@repo/content/schemas/builders-hub.ts`. The split is preserved by
 * `mapDocToFixtureFiles` in the workflow service — index-level fields go to
 * `index.json`, locale-level fields go to `<lang>.json`.
 *
 * For Phase 4b.3: only English ("en") is editable in Admin. Future work adds
 * locale tabs once the multi-locale story is finalised in Payload's i18n
 * config.
 */
export const Rfps: CollectionConfig = {
  slug: 'rfps',
  labels: {
    plural: 'RFSs',
    singular: 'RFS',
  },
  admin: {
    defaultColumns: ['title', 'slug', 'status', 'featured', 'updatedAt'],
    useAsTitle: 'title',
    description:
      'Funded calls for builders to ship Logos-powered applications. ' +
      'Saves as a draft to Payload; click "Create PR" to publish to the repo.',
  },
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    // ----- Lock banner: surface in-flight PRs for this slug -----
    {
      name: 'lockBanner',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/lock-banner.tsx#RfpLockBanner',
        },
      },
    },

    // ----- Identity / status -----
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description:
          'URL-safe identifier — kebab-case, ASCII only. Used as the directory name in `content/builders-hub/rfps/<slug>/`.',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Review', value: 'review' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },

    // ----- Locale-level (English) -----
    {
      type: 'collapsible',
      label: 'Copy (English)',
      admin: { initCollapsed: false },
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'tagline',
          type: 'text',
          maxLength: 120,
          admin: {
            description:
              'One-line pitch (~80 chars) shown on the home grid card and listing rows.',
          },
        },
        { name: 'summary', type: 'textarea', required: true },
        {
          name: 'description',
          type: 'textarea',
          required: true,
          admin: {
            description:
              'Full-length RFP description — 2–3 paragraphs of context and deliverables.',
          },
        },
        {
          name: 'ctaLabel',
          type: 'text',
          admin: {
            description: 'Per-card CTA text. Defaults to "Apply" when empty.',
          },
        },
      ],
    },

    // ----- Reward -----
    {
      type: 'collapsible',
      label: 'Reward',
      admin: { initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'rewardAmount',
              type: 'number',
              required: true,
              min: 0,
              admin: { width: '40%' },
            },
            {
              name: 'rewardCurrency',
              type: 'select',
              required: true,
              defaultValue: 'USDC',
              options: [{ label: 'USDC', value: 'USDC' }],
              admin: { width: '30%' },
            },
            {
              name: 'rewardXp',
              type: 'number',
              min: 0,
              admin: {
                width: '30%',
                description: 'Optional XP bonus.',
              },
            },
          ],
        },
      ],
    },

    // ----- Index-level metadata -----
    {
      type: 'collapsible',
      label: 'Metadata',
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'applyUrl',
          type: 'text',
          required: true,
          admin: {
            description:
              'Where the "Apply" CTA points. Internal route ("/path") or external https URL.',
          },
        },
        {
          name: 'tags',
          type: 'text',
          hasMany: true,
          admin: {
            description:
              'Free-form lower-case tags — used for filtering on the listing page.',
          },
        },
        { name: 'featured', type: 'checkbox', defaultValue: false },
        {
          name: 'order',
          type: 'number',
          min: 0,
          admin: {
            description:
              'Sort key (ascending). Lower numbers appear first on the home grid.',
          },
        },
        { name: 'publishedAt', type: 'date' },
        { name: 'closesAt', type: 'date' },
        {
          type: 'row',
          fields: [
            {
              name: 'ownerName',
              type: 'text',
              admin: {
                width: '50%',
                description: 'Display name (e.g. "Logos Core").',
              },
            },
            {
              name: 'ownerHandle',
              type: 'text',
              admin: {
                width: '50%',
                description: 'Stored without the leading "@".',
              },
            },
          ],
        },
        {
          name: 'relatedIdeas',
          type: 'text',
          hasMany: true,
          admin: {
            description:
              'Slugs from the Ideas collection that this RFP relates to.',
          },
        },
      ],
    },

    // ----- Action: Create / update PR -----
    {
      name: 'createPrAction',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/save-pr-button.tsx#SaveRfpPrButton',
        },
      },
    },
  ],
  timestamps: true,
}
