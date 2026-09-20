import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Site } from '../client'
import { loadPublicState, publicConfig, siteOrigin } from '../../lib/public-data'

export const dynamic = 'force-dynamic'
type Props = {
  params: Promise<{ path?: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}
const titles: Record<string, string> = {
  '/': '',
  '/archive': '全部内容',
  '/writing': '文章',
  '/photos': '影像',
  '/projects': '项目',
  '/about': '关于',
  '/guestbook': '留言',
  '/login': '登录',
  '/register': '注册',
  '/recover': '找回账号',
  '/account': '我的账号',
  '/studio': '工作台',
  '/play/color': '色彩练习',
}
function privateRoute(path: string) {
  return /^\/(studio|login|register|recover|account|auth)(\/|$)/.test(path)
}
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const path = '/' + ((await params).path || []).join('/')
  const query = await searchParams
  const state = await loadPublicState()
  const entry = state.entries.find((item) => path === `/entry/${item.id}`)
  const title = [entry?.title || titles[path], state.settings.name].filter(Boolean).join(' · ')
  const description = (entry?.summary || state.settings.intro || state.settings.name).slice(0, 180)
  const canonical = new URL(path, siteOrigin()).href
  const hidden = privateRoute(path) || query.draft === '1' || Object.keys(query).length > 0
  return {
    title,
    description,
    alternates: { canonical },
    robots: hidden ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: entry?.kind === 'writing' ? 'article' : 'website',
      locale: 'zh_CN',
      ...(entry?.cover ? { images: [new URL(entry.cover, siteOrigin()).href] } : {}),
    },
  }
}
export default async function Page({ params, searchParams }: Props) {
  const path = '/' + ((await params).path || []).join('/')
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === 'string') query.set(key, value)
  }
  const state = await loadPublicState()
  if (
    path.startsWith('/entry/') &&
    query.get('draft') !== '1' &&
    !state.entries.some((entry) => path === `/entry/${entry.id}`)
  )
    notFound()
  if (!(path in titles) && !/^\/(entry|topics|studio|auth)\//.test(path)) notFound()
  return (
    <Site state={state} config={publicConfig()} route={path + (query.size ? `?${query}` : '')} />
  )
}
