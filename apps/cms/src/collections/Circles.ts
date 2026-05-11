import type { CollectionConfig, Field } from 'payload'

import {
  authenticatedCollectionAccess,
  createImageFields,
  createPrActionField,
  createPublishStatusField,
  createSlugField,
} from './shared-fields'
import { isValidIanaTimeZone } from '@/lib/timezones'

const createTimeZoneField = (width: string): Field => ({
  name: 'timezone',
  type: 'text',
  required: true,
  admin: {
    components: {
      Field: '@/components/admin/timezone-field.tsx#TimezoneField',
    },
    width,
  },
  validate: (value) => {
    if (typeof value !== 'string' || value.length === 0) {
      return 'A timezone is required.'
    }

    return (
      isValidIanaTimeZone(value) ||
      'Must be a valid IANA timezone, e.g. "America/Los_Angeles".'
    )
  },
})

export const Circles: CollectionConfig = {
  slug: 'circles',
  admin: {
    defaultColumns: ['name', 'slug', 'city', 'status', 'updatedAt'],
    useAsTitle: 'name',
    description:
      'Local Logos chapters. Shape mirrors content/circles/circles fixtures.',
  },
  access: authenticatedCollectionAccess,
  fields: [
    createSlugField(),
    createPublishStatusField(),
    {
      type: 'collapsible',
      label: 'Copy (English)',
      admin: { initCollapsed: false },
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
      ],
    },
    {
      type: 'collapsible',
      label: 'Location',
      admin: { initCollapsed: false },
      fields: [
        { name: 'city', type: 'text', required: true },
        { name: 'country', type: 'text', required: true },
        { name: 'region', type: 'text' },
        {
          type: 'row',
          fields: [
            {
              name: 'lat',
              type: 'number',
              required: true,
              admin: { width: '33%' },
            },
            {
              name: 'lng',
              type: 'number',
              required: true,
              admin: { width: '33%' },
            },
            {
              ...createTimeZoneField('34%'),
            },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Community',
      admin: { initCollapsed: true },
      fields: [
        { name: 'memberCount', type: 'number', min: 0 },
        { name: 'discordChannel', type: 'text' },
        { name: 'discordUrl', type: 'text' },
        { name: 'forumUrl', type: 'text' },
        { name: 'joinUrl', type: 'text', required: true },
        {
          name: 'organizers',
          type: 'array',
          fields: [
            { name: 'name', type: 'text', required: true },
            { name: 'handle', type: 'text' },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Image',
      admin: { initCollapsed: true },
      fields: createImageFields(),
    },
    { name: 'order', type: 'number', min: 0 },
    createPrActionField(
      '@/components/admin/save-pr-button.tsx#SaveCirclePrButton'
    ),
  ],
  timestamps: true,
}

export const CircleEvents: CollectionConfig = {
  slug: 'circle-events',
  admin: {
    defaultColumns: ['title', 'slug', 'circleSlug', 'status', 'startsAt'],
    useAsTitle: 'title',
    description:
      'Circle gatherings. Shape mirrors content/circles/events fixtures.',
  },
  access: authenticatedCollectionAccess,
  fields: [
    createSlugField(),
    createPublishStatusField(),
    { name: 'circleSlug', type: 'text', required: true, index: true },
    {
      type: 'collapsible',
      label: 'Copy (English)',
      admin: { initCollapsed: false },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'locationLabel', type: 'text', required: true },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startsAt',
          type: 'date',
          required: true,
          admin: { width: '33%' },
        },
        { name: 'endsAt', type: 'date', admin: { width: '33%' } },
        {
          ...createTimeZoneField('34%'),
        },
      ],
    },
    { name: 'venueName', type: 'text' },
    { name: 'address', type: 'text' },
    { name: 'eventUrl', type: 'text' },
    {
      name: 'hostedBy',
      type: 'array',
      fields: [{ name: 'name', type: 'text', required: true }],
    },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'sequenceNumber', type: 'number', min: 1 },
    {
      type: 'collapsible',
      label: 'Image',
      admin: { initCollapsed: true },
      fields: createImageFields(),
    },
    createPrActionField(
      '@/components/admin/save-pr-button.tsx#SaveCircleEventPrButton'
    ),
  ],
  timestamps: true,
}

export const CircleInitiatives: CollectionConfig = {
  slug: 'circle-initiatives',
  admin: {
    defaultColumns: ['title', 'slug', 'circleSlug', 'status', 'updatedAt'],
    useAsTitle: 'title',
    description:
      'Winnable local issues. Shape mirrors content/circles/initiatives fixtures.',
  },
  access: authenticatedCollectionAccess,
  fields: [
    createSlugField(),
    createPublishStatusField(),
    { name: 'circleSlug', type: 'text', required: true, index: true },
    { name: 'href', type: 'text', required: true },
    {
      type: 'collapsible',
      label: 'Copy (English)',
      admin: { initCollapsed: false },
      fields: [
        { name: 'locationLabel', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea', required: true },
        { name: 'ctaLabel', type: 'text', required: true },
      ],
    },
    {
      type: 'collapsible',
      label: 'Image',
      admin: { initCollapsed: true },
      fields: createImageFields(),
    },
    { name: 'featured', type: 'checkbox', defaultValue: false },
    { name: 'order', type: 'number', min: 0 },
    createPrActionField(
      '@/components/admin/save-pr-button.tsx#SaveCircleInitiativePrButton'
    ),
  ],
  timestamps: true,
}

export const CircleResources: CollectionConfig = {
  slug: 'circle-resources',
  admin: {
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
    useAsTitle: 'title',
    description:
      'Resources shown on the Circles page. Shape mirrors content/circles/resources.',
  },
  access: authenticatedCollectionAccess,
  fields: [
    createSlugField(),
    createPublishStatusField(),
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea', required: true },
    { name: 'ctaLabel', type: 'text', required: true },
    { name: 'href', type: 'text', required: true },
  ],
  timestamps: true,
}
