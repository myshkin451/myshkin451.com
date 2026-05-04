import { cache } from 'react'
import type { Where } from 'payload'

import type { Article, Project } from '@/payload-types'

import { getPayloadClient } from './payload'

const publishedWhere = (slug?: string): Where => ({
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
    ...(slug
      ? [
          {
            slug: {
              equals: slug,
            },
          },
        ]
      : []),
  ],
})

export const listPublishedArticles = cache(async (): Promise<Article[]> => {
  const payload = await getPayloadClient()

  const articles = await payload.find({
    collection: 'articles',
    depth: 1,
    limit: 24,
    sort: '-publishedAt',
    where: publishedWhere(),
  })

  return articles.docs
})

export const getPublishedArticleBySlug = cache(async (slug: string): Promise<Article | null> => {
  const payload = await getPayloadClient()

  const articles = await payload.find({
    collection: 'articles',
    depth: 1,
    limit: 1,
    where: publishedWhere(slug),
  })

  return articles.docs[0] ?? null
})

export const listPublishedProjects = cache(async (): Promise<Project[]> => {
  const payload = await getPayloadClient()

  const projects = await payload.find({
    collection: 'projects',
    depth: 1,
    limit: 24,
    sort: '-publishedAt',
    where: publishedWhere(),
  })

  return projects.docs
})

export const getPublishedProjectBySlug = cache(async (slug: string): Promise<Project | null> => {
  const payload = await getPayloadClient()

  const projects = await payload.find({
    collection: 'projects',
    depth: 1,
    limit: 1,
    where: publishedWhere(slug),
  })

  return projects.docs[0] ?? null
})
