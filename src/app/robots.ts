import type { MetadataRoute } from 'next'

import { absoluteUrl, siteConfig } from '@/lib/siteMetadata'

export default function robots(): MetadataRoute.Robots {
  return {
    host: siteConfig.url,
    rules: {
      allow: '/',
      disallow: ['/admin/', '/api/graphql', '/api/graphql-playground'],
      userAgent: '*',
    },
    sitemap: absoluteUrl('/sitemap.xml'),
  }
}
