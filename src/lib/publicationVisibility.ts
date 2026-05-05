import type { Where } from 'payload'

export function publicVisibilityConditions(now = new Date().toISOString()): Where[] {
  return [
    {
      status: {
        equals: 'published',
      },
    },
    {
      publishedAt: {
        less_than_equal: now,
      },
    },
  ]
}

export function publicVisibilityWhere(now?: string): Where {
  return {
    and: publicVisibilityConditions(now),
  }
}
