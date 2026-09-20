import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'
import { defaultSettings } from '../../frontend/src/seed'
import { initialState } from '../../frontend/src/model'
import type { Entry, Settings, StoredState } from '../../frontend/src/types'

export function publicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('网站尚未配置内容服务。')
  const parsed = new URL(url)
  if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('内容服务地址无效。')
  return {
    url,
    key,
    emailEnabled: process.env.NEXT_PUBLIC_EMAIL_AUTH_ENABLED === 'true',
    githubEnabled: process.env.NEXT_PUBLIC_GITHUB_AUTH_ENABLED === 'true',
  }
}

export function publicClient() {
  const { url, key } = publicConfig()
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

export function siteOrigin() {
  const configured =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined)
  if (!configured) throw new Error('需要配置网站的正式访问地址 SITE_URL。')
  const url = new URL(configured)
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
    throw new Error('网站访问地址无效。')
  return url.origin
}

export const loadPublicState = cache(async (): Promise<StoredState> => {
  const client = publicClient()
  const readEntries = async () => {
    const result: Entry[] = []
    let after = ''
    for (;;) {
      let query = client.from('published_entries').select('id,data').order('id').limit(500)
      if (after) query = query.gt('id', after)
      const { data, error } = await query
      if (error) throw new Error('暂时无法读取内容，请稍后重试。')
      result.push(...data.map((row) => row.data as Entry))
      if (data.length < 500) return result
      after = data[data.length - 1].id
    }
  }
  const [entries, settings] = await Promise.all([
    readEntries(),
    client.from('site_settings').select('data').eq('id', true).single(),
  ])
  if (settings.error) throw new Error('暂时无法读取内容，请稍后重试。')
  return {
    ...initialState(defaultSettings),
    mode: 'empty',
    entries,
    settings: (settings.data?.data as Settings) || defaultSettings,
  }
})
