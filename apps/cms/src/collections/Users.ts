import type { Access, CollectionConfig, FieldAccess } from 'payload'
import { initialiseUserRole, readLoginRole, saveUserRole } from './user-roles'

const isAdmin: Access = ({ req }) => req.user?.role === 'admin'
const adminField: FieldAccess = ({ req }) => req.user?.role === 'admin'
const adminOrSelf: Access = ({ req }) => {
  if (!req.user) return false
  if (req.user.role === 'admin') return true
  return { id: { equals: req.user.id } }
}

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    admin: ({ req }) => Boolean(req.user),
    create: isAdmin,
    read: adminOrSelf,
    update: adminOrSelf,
    delete: ({ req }) =>
      req.user?.role === 'admin' ? { id: { not_equals: req.user.id } } : false,
    unlock: isAdmin,
  },
  hooks: {
    beforeChange: [initialiseUserRole],
    afterChange: [saveUserRole],
    afterLogin: [readLoginRole],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Administrator', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      access: {
        create: adminField,
        update: ({ req, doc }) =>
          req.user?.role === 'admin' && req.user.id !== doc?.id,
      },
    },
  ],
}
