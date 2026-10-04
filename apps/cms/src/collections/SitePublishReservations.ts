import type { CollectionConfig } from 'payload'

export const SitePublishReservations: CollectionConfig = {
  slug: 'site-publish-reservations',
  admin: { hidden: true },
  access: {
    create: () => false,
    read: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true },
    { name: 'token', type: 'text', required: true },
    { name: 'environment', type: 'text', required: true },
    { name: 'baselineBuild', type: 'number', required: true },
  ],
}
