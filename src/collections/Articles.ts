import type { CollectionConfig } from 'payload'

import {
  normalizeContentLifecycle,
  publishedOrAuthenticated,
  publishingFields,
} from './contentLifecycle'

export const Articles: CollectionConfig = {
  slug: 'articles',
  access: {
    read: publishedOrAuthenticated,
  },
  admin: {
    defaultColumns: ['title', 'status', 'publishedAt', 'updatedAt'],
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
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description: 'Short public summary for article lists and previews.',
      },
      maxLength: 360,
      required: true,
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
