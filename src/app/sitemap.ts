import type { MetadataRoute } from 'next'

import { listPublishedArticles, listPublishedProjects } from '@/lib/publicContent'
import { absoluteUrl } from '@/lib/siteMetadata'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, projects] = await Promise.all([listPublishedArticles(), listPublishedProjects()])

  return [
    {
      changeFrequency: 'weekly',
      lastModified: new Date(),
      priority: 1,
      url: absoluteUrl('/'),
    },
    {
      changeFrequency: 'weekly',
      lastModified: new Date(),
      priority: 0.8,
      url: absoluteUrl('/articles'),
    },
    {
      changeFrequency: 'weekly',
      lastModified: new Date(),
      priority: 0.8,
      url: absoluteUrl('/projects'),
    },
    {
      changeFrequency: 'monthly',
      lastModified: new Date(),
      priority: 0.7,
      url: absoluteUrl('/knowledge'),
    },
    {
      changeFrequency: 'monthly',
      lastModified: new Date(),
      priority: 0.7,
      url: absoluteUrl('/labs'),
    },
    {
      changeFrequency: 'monthly',
      lastModified: new Date(),
      priority: 0.7,
      url: absoluteUrl('/about'),
    },
    ...articles.map((article) => ({
      changeFrequency: 'monthly' as const,
      lastModified: article.updatedAt ?? article.publishedAt ?? new Date(),
      priority: 0.7,
      url: absoluteUrl(`/articles/${article.slug}`),
    })),
    ...projects.map((project) => ({
      changeFrequency: 'monthly' as const,
      lastModified: project.updatedAt ?? project.publishedAt ?? new Date(),
      priority: 0.7,
      url: absoluteUrl(`/projects/${project.slug}`),
    })),
  ]
}
