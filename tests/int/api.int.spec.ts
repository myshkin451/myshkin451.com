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
const draftArticleSlug = `${testStamp}-article-draft`
const publishedProjectSlug = `${testStamp}-project-published`
const draftProjectSlug = `${testStamp}-project-draft`
const publishedAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

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

  it('exposes published articles and hides drafts from public queries', async () => {
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

    const publishedArticle = await getPublishedArticleBySlug(publishedArticleSlug)
    const draftArticle = await getPublishedArticleBySlug(draftArticleSlug)
    const articleSlugs = (await listPublishedArticles()).map((article) => article.slug)

    expect(publishedArticle?.slug).toBe(publishedArticleSlug)
    expect(draftArticle).toBeNull()
    expect(articleSlugs).toContain(publishedArticleSlug)
    expect(articleSlugs).not.toContain(draftArticleSlug)
  })

  it('exposes published projects and hides drafts from public queries', async () => {
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

    const publishedProject = await getPublishedProjectBySlug(publishedProjectSlug)
    const draftProject = await getPublishedProjectBySlug(draftProjectSlug)
    const projectSlugs = (await listPublishedProjects()).map((project) => project.slug)

    expect(publishedProject?.slug).toBe(publishedProjectSlug)
    expect(draftProject).toBeNull()
    expect(projectSlugs).toContain(publishedProjectSlug)
    expect(projectSlugs).not.toContain(draftProjectSlug)
  })
})

async function cleanupContentRecords() {
  await payload.delete({
    collection: 'articles',
    where: {
      slug: {
        in: [publishedArticleSlug, draftArticleSlug],
      },
    },
  })

  await payload.delete({
    collection: 'projects',
    where: {
      slug: {
        in: [publishedProjectSlug, draftProjectSlug],
      },
    },
  })
}
