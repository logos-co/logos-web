import type { CollectionConfig } from 'payload'

import { createSlugField } from './shared-fields'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    defaultColumns: ['title', 'slug', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    createSlugField(),
    {
      name: 'content',
      type: 'richText',
    },
  ],
  versions: {
    drafts: true,
  },
}
