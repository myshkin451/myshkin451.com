import fs from 'fs/promises'
import path from 'path'

import sharp from 'sharp'
import { getPayload, type Payload } from 'payload'

import config from '../../src/payload.config'
import type { Article } from '../../src/payload-types'

const fixtureAlt = 'Platform loop fixture cover'

type LoopFixture = {
  articleSlug: string
  articleTitle: string
  coverAlt: string
  mediaId: number
  projectSlug: string
  projectTitle: string
  tempImagePath: string
}

export async function createPlatformLoopFixture(): Promise<LoopFixture> {
  const payload = await getPayload({ config })
  const stamp = Date.now().toString(36)
  const tempImagePath = await createCoverImage(stamp)

  const media = await payload.create({
    collection: 'media',
    data: {
      alt: fixtureAlt,
    },
    filePath: tempImagePath,
  })

  const articleTitle = `Platform loop article ${stamp}`
  const articleSlug = `platform-loop-article-${stamp}`
  const projectTitle = `Platform loop project ${stamp}`
  const projectSlug = `platform-loop-project-${stamp}`

  await payload.create({
    collection: 'articles',
    data: {
      content: richText('This browser fixture proves a published Payload article route.'),
      coverImage: media.id,
      excerpt: 'Browser fixture article for the first platform loop.',
      slug: articleSlug,
      status: 'published',
      title: articleTitle,
    },
  })

  await payload.create({
    collection: 'projects',
    data: {
      content: richText('This browser fixture proves a published Payload project route.'),
      coverImage: media.id,
      projectStatus: 'active',
      slug: projectSlug,
      status: 'published',
      summary: 'Browser fixture project for the first platform loop.',
      title: projectTitle,
    },
  })

  return {
    articleSlug,
    articleTitle,
    coverAlt: fixtureAlt,
    mediaId: media.id,
    projectSlug,
    projectTitle,
    tempImagePath,
  }
}

export async function cleanupPlatformLoopFixture(fixture: LoopFixture | undefined): Promise<void> {
  if (!fixture) {
    return
  }

  const payload = await getPayload({ config })

  await deleteBySlug(payload, 'articles', fixture.articleSlug)
  await deleteBySlug(payload, 'projects', fixture.projectSlug)
  await payload.delete({
    collection: 'media',
    id: fixture.mediaId,
  })

  await fs.unlink(fixture.tempImagePath).catch(() => undefined)
}

async function createCoverImage(stamp: string): Promise<string> {
  const outputDir = path.resolve(process.cwd(), 'test-results', 'fixtures')
  const outputPath = path.join(outputDir, `platform-loop-cover-${stamp}.png`)

  await fs.mkdir(outputDir, { recursive: true })

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
      <rect width="1600" height="900" fill="#f4f1e8"/>
      <rect x="96" y="96" width="1408" height="708" fill="#1d2b24"/>
      <circle cx="1168" cy="300" r="146" fill="#87986a"/>
      <text x="144" y="430" font-family="Arial, sans-serif" font-size="86" font-weight="700" fill="#fffdf7">Myshkin 451</text>
      <text x="148" y="532" font-family="Arial, sans-serif" font-size="42" fill="#d9dfd3">browser platform loop fixture</text>
    </svg>
  `

  await sharp(Buffer.from(svg)).png().toFile(outputPath)

  return outputPath
}

function richText(text: string): Article['content'] {
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text,
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
}

async function deleteBySlug(
  payload: Payload,
  collection: 'articles' | 'projects',
  slug: string,
): Promise<void> {
  await payload.delete({
    collection,
    where: {
      slug: {
        equals: slug,
      },
    },
  })
}
