import type { MetadataRoute } from 'next'
import { siteOrigin } from '../lib/public-data'
export const dynamic = 'force-dynamic'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/studio', '/account', '/login', '/register', '/recover', '/auth', '/*?draft='],
    },
    sitemap: `${siteOrigin()}/sitemap.xml`,
  }
}
