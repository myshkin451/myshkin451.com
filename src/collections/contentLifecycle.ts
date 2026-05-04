import type { Access, CollectionBeforeValidateHook, Field, Where } from 'payload'

export const PUBLICATION_STATUS_OPTIONS = [
  {
    label: 'Draft',
    value: 'draft',
  },
  {
    label: 'Published',
    value: 'published',
  },
] as const

const publishedWhere = (): Where => ({
  and: [
    {
      status: {
        equals: 'published',
      },
    },
    {
      publishedAt: {
        less_than_equal: new Date().toISOString(),
      },
    },
  ],
})

export const publishedOrAuthenticated: Access = ({ req }) => {
  if (req.user) {
    return true
  }

  return publishedWhere()
}

export const normalizeContentLifecycle: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) {
    return data
  }

  const next = { ...data }

  if (typeof next.title === 'string' && !next.slug) {
    next.slug = slugify(next.title)
  }

  if (next.status === 'published' && !next.publishedAt) {
    next.publishedAt = new Date().toISOString()
  }

  return next
}

export const publishingFields: Field[] = [
  {
    name: 'slug',
    type: 'text',
    admin: {
      description: 'Stable public URL segment. Edit deliberately after publishing.',
    },
    index: true,
    required: true,
    unique: true,
  },
  {
    name: 'status',
    type: 'select',
    defaultValue: 'draft',
    options: [...PUBLICATION_STATUS_OPTIONS],
    required: true,
  },
  {
    name: 'publishedAt',
    type: 'date',
    admin: {
      date: {
        pickerAppearance: 'dayAndTime',
      },
      description: 'Published items become public when this time is in the past.',
    },
  },
  {
    name: 'coverImage',
    type: 'upload',
    relationTo: 'media',
  },
]

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')

  return slug || 'untitled'
}
