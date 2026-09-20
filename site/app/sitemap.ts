import type { MetadataRoute } from 'next'
import { loadPublicState, siteOrigin } from '../lib/public-data'
export const dynamic = 'force-dynamic'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const state = await loadPublicState()
  const origin = siteOrigin()
  return [
    ...['', '/archive', '/notes', '/writing', '/photos', '/projects', '/about', '/guestbook'].map(
      (path) => ({
        url: origin + path,
      }),
    ),
    ...state.entries.map((entry) => ({
      url: `${origin}/entry/${entry.id}`,
      lastModified: new Date(entry.updatedAt),
    })),
  ]
}
