import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import {
  getPublishedArticleBySlug,
  getPublishedProjectBySlug,
  listPublishedArticles,
  listPublishedProjects,
} from '@/lib/publicContent'
import type { Article } from '@/payload-types'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
const testStamp = 'platform-loop-int'
const publishedArticleSlug = `${testStamp}-article-published`
const futureArticleSlug = `${testStamp}-article-future`
const draftArticleSlug = `${testStamp}-article-draft`
const publishedProjectSlug = `${testStamp}-project-published`
const futureProjectSlug = `${testStamp}-project-future`
const draftProjectSlug = `${testStamp}-project-draft`
const publishedAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
const futurePublishedAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

const richText: Article['content'] = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: 'This record proves the public content loop.',
            type: 'text',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
}

describe('API', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    await cleanupContentRecords()
  })

  afterAll(async () => {
    await cleanupContentRecords()
  })

  it('fetches users', async () => {
    const users = await payload.find({
      collection: 'users',
    })
    expect(users).toBeDefined()
  })

  it('exposes due published articles and hides drafts or future-dated records from public queries', async () => {
    await payload.create({
      collection: 'articles',
      data: {
        content: richText,
        excerpt: 'A published article for the public query boundary.',
        publishedAt,
        slug: publishedArticleSlug,
        status: 'published',
        title: 'Published article',
      },
    })

    await payload.create({
      collection: 'articles',
      data: {
        content: richText,
        excerpt: 'A draft article that should stay out of public queries.',
        slug: draftArticleSlug,
        status: 'draft',
        title: 'Draft article',
      },
    })

    await payload.create({
      collection: 'articles',
      data: {
        content: richText,
        excerpt: 'A future-dated article that should stay out of public queries.',
        publishedAt: futurePublishedAt,
        slug: futureArticleSlug,
        status: 'published',
        title: 'Future article',
      },
    })

    const publishedArticle = await getPublishedArticleBySlug(publishedArticleSlug)
    const futureArticle = await getPublishedArticleBySlug(futureArticleSlug)
    const draftArticle = await getPublishedArticleBySlug(draftArticleSlug)
    const articleSlugs = (await listPublishedArticles()).map((article) => article.slug)

    expect(publishedArticle?.slug).toBe(publishedArticleSlug)
    expect(futureArticle).toBeNull()
    expect(draftArticle).toBeNull()
    expect(articleSlugs).toContain(publishedArticleSlug)
    expect(articleSlugs).not.toContain(futureArticleSlug)
    expect(articleSlugs).not.toContain(draftArticleSlug)
  })

  it('exposes due published projects and hides drafts or future-dated records from public queries', async () => {
    await payload.create({
      collection: 'projects',
      data: {
        content: richText,
        projectStatus: 'active',
        publishedAt,
        slug: publishedProjectSlug,
        status: 'published',
        summary: 'A published project for the public query boundary.',
        title: 'Published project',
      },
    })

    await payload.create({
      collection: 'projects',
      data: {
        content: richText,
        projectStatus: 'paused',
        slug: draftProjectSlug,
        status: 'draft',
        summary: 'A draft project that should stay out of public queries.',
        title: 'Draft project',
      },
    })

    await payload.create({
      collection: 'projects',
      data: {
        content: richText,
        projectStatus: 'active',
        publishedAt: futurePublishedAt,
        slug: futureProjectSlug,
        status: 'published',
        summary: 'A future-dated project that should stay out of public queries.',
        title: 'Future project',
      },
    })

    const publishedProject = await getPublishedProjectBySlug(publishedProjectSlug)
    const futureProject = await getPublishedProjectBySlug(futureProjectSlug)
    const draftProject = await getPublishedProjectBySlug(draftProjectSlug)
    const projectSlugs = (await listPublishedProjects()).map((project) => project.slug)

    expect(publishedProject?.slug).toBe(publishedProjectSlug)
    expect(futureProject).toBeNull()
    expect(draftProject).toBeNull()
    expect(projectSlugs).toContain(publishedProjectSlug)
    expect(projectSlugs).not.toContain(futureProjectSlug)
    expect(projectSlugs).not.toContain(draftProjectSlug)
  })
})

async function cleanupContentRecords() {
  if (!payload) {
    return
  }

  await payload.delete({
    collection: 'articles',
    where: {
      slug: {
        in: [publishedArticleSlug, futureArticleSlug, draftArticleSlug],
      },
    },
  })

  await payload.delete({
    collection: 'projects',
    where: {
      slug: {
        in: [publishedProjectSlug, futureProjectSlug, draftProjectSlug],
      },
    },
  })
}
