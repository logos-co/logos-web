import type { CollectionConfig } from 'payload'

export const ResourceRenames: CollectionConfig = {
  slug: 'resource-renames',
  admin: { hidden: true },
  lockDocuments: false,
  access: {
    create: () => false,
    read: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'record', type: 'text', required: true, unique: true },
    { name: 'list', type: 'text', required: true, index: true },
    { name: 'fromSlug', type: 'text', required: true },
    { name: 'toSlug', type: 'text', required: true },
  ],
}
