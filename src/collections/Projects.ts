import type { CollectionConfig } from 'payload'

import {
  normalizeContentLifecycle,
  publishedOrAuthenticated,
  publishingFields,
} from './contentLifecycle'

export const Projects: CollectionConfig = {
  slug: 'projects',
  access: {
    read: publishedOrAuthenticated,
  },
  admin: {
    defaultColumns: ['title', 'projectStatus', 'status', 'publishedAt', 'updatedAt'],
    group: 'Content',
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    ...publishingFields,
    {
      name: 'projectStatus',
      type: 'select',
      defaultValue: 'active',
      options: [
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Maintained',
          value: 'maintained',
        },
        {
          label: 'Paused',
          value: 'paused',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
      required: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: {
        description: 'Public project summary for lists and previews.',
      },
      maxLength: 420,
      required: true,
    },
    {
      name: 'links',
      type: 'array',
      admin: {
        description:
          'Optional public links such as demo, repository, writing, or reference material.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'technologies',
      type: 'array',
      admin: {
        description: 'Optional tools, languages, or systems that help readers scan the project.',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
  ],
  hooks: {
    beforeValidate: [normalizeContentLifecycle],
  },
}
