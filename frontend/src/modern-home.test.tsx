// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HomePresentation } from './modern/HomePresentation'
import { initialState } from './model'
import { NavigationProvider } from './navigation'
import { PublicPage } from './pages/Public'
import { defaultSettings } from './seed'
import { newEntry, type Entry, type Platform } from './types'

const fixture = vi.hoisted(() => ({ platform: {} as Platform }))
vi.mock('./platform', () => ({ usePlatform: () => fixture.platform }))

const publishedAt = '2026-09-27T02:00:00.000Z'
const settings = {
  ...defaultSettings,
  name: '渡口与光',
  intro: '存放日常的文字、照片和尝试。',
}

function makeEntry(values: Partial<Entry> = {}): Entry {
  return {
    ...newEntry(values.kind),
    title: '一次普通的记录',
    body: '这是已经公开的正文。',
    status: 'published',
    publishedAt,
    discussion: false,
    ...values,
  }
}

function setContent(entries: Entry[], drafts: Entry[] = []) {
  fixture.platform = {
    ready: true,
    remote: true,
    entries,
    drafts,
    state: { ...initialState(settings), entries, drafts },
  } as Platform
}

function Page({ route = '/' }: { route?: string }) {
  const [path, query = ''] = route.split('?')
  return (
    <NavigationProvider route={route}>
      <PublicPage path={path} params={new URLSearchParams(query)} />
    </NavigationProvider>
  )
}

function serverRender(route = '/') {
  vi.stubGlobal('window', undefined)
  vi.stubGlobal('document', undefined)
  try {
    return renderToString(<Page route={route} />)
  } finally {
    vi.unstubAllGlobals()
  }
}

beforeEach(() => {
  document.body.dataset.routing = 'path'
  window.history.replaceState(null, '', '/')
  sessionStorage.clear()
  setContent([])
})

afterEach(() => {
  cleanup()
  delete document.body.dataset.routing
  window.history.replaceState(null, '', '/')
})

describe('modern home with published owner content', () => {
  it('starts empty with the configured identity and usable production links', () => {
    render(<Page />)
    expect(screen.getByText(settings.name)).toBeTruthy()
    expect(screen.getByText(settings.intro)).toBeTruthy()
    expect(screen.getByText('还没有公开的内容。')).toBeTruthy()
    expect(screen.getByRole('link', { name: '关于这个网站' }).getAttribute('href')).toBe('/about')
    const navigation = within(screen.getByRole('navigation', { name: '浏览内容' }))
    expect(navigation.getByRole('link', { name: '文章' }).getAttribute('href')).toBe('/writing')
    expect(navigation.getByRole('link', { name: '随记' }).getAttribute('href')).toBe('/notes')
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.queryByText('图像取景')).toBeNull()
  })

  it('presents one coverless UUID article with its complete long title and a reading destination', () => {
    const title = '在普通的日常里记录光线、天气和一条反复走过的路：关于 <观察> 与重新开始的长篇记录'
    const entry = makeEntry({ title, summary: '一篇没有封面的文章。' })
    render(
      <NavigationProvider route="/">
        <HomePresentation entries={[entry]} settings={settings} />
      </NavigationProvider>,
    )
    const heading = screen.getByRole('heading', { name: title, level: 2 })
    expect(heading.textContent).toBe(title)
    expect(within(heading).getByRole('link').getAttribute('href')).toBe(`/entry/${entry.id}`)
    expect(screen.getByRole('link', { name: '阅读全文' }).getAttribute('href')).toBe(
      `/entry/${entry.id}`,
    )
    expect(screen.getByText(entry.body)).toBeTruthy()
    expect(screen.queryByText('还没有公开的内容。')).toBeNull()
    expect(screen.queryByRole('heading', { name: '最近的随记' })).toBeNull()
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('treats title-free notes as real published content when there are no other works', () => {
    const older = makeEntry({ kind: 'note', title: '', body: '昨天走到桥边。' })
    const newer = makeEntry({
      kind: 'note',
      title: '',
      body: '今天看见雨后的街道。',
      publishedAt: '2026-09-28T02:00:00.000Z',
    })
    setContent([older, newer])
    render(<Page />)
    expect(screen.getByRole('heading', { name: '最近的随记' })).toBeTruthy()
    expect(screen.queryByText('还没有公开的内容。')).toBeNull()
    expect(screen.queryByText('未命名')).toBeNull()
    const noteLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('/entry/'))
    expect(noteLinks.map((link) => link.getAttribute('href'))).toEqual([
      `/entry/${newer.id}`,
      `/entry/${older.id}`,
    ])
    expect(screen.getByText(newer.body)).toBeTruthy()
    expect(screen.getByRole('link', { name: '查看全部' }).getAttribute('href')).toBe('/notes')
  })

  it('shows arbitrary project, article and photo UUIDs without relying on study fixture IDs', () => {
    const project = makeEntry({ kind: 'project', title: '散步路线', featured: true })
    const writing = makeEntry({ title: '关于一段路的记录' })
    const photo = makeEntry({
      kind: 'photo',
      title: '街角',
      photos: [
        {
          id: crypto.randomUUID(),
          src: '/assets/owner-photo.jpg',
          alt: '雨后路口的斑马线与树影',
          caption: '回家的路上',
          credit: '作者拍摄',
        },
      ],
    })
    setContent([photo, writing, project])
    const { container } = render(<Page />)
    for (const entry of [project, writing, photo]) {
      expect(screen.getByRole('heading', { name: entry.title })).toBeTruthy()
      expect(container.querySelector(`a[href="/entry/${entry.id}"]`)).toBeTruthy()
    }
    expect(screen.getByRole('img', { name: photo.photos[0].alt }).getAttribute('src')).toBe(
      photo.photos[0].src,
    )
    expect(screen.getByText('作者拍摄')).toBeTruthy()
    expect(screen.queryByText('AI 生成样图')).toBeNull()
    expect(screen.queryByRole('group', { name: '取景比例' })).toBeNull()
  })

  it('keeps private entries and unpublished revisions out of home, archive and direct public SSR', () => {
    const published = makeEntry({ title: '已经发布的文章', body: '公开版本正文' })
    const privateEntry = makeEntry({
      status: 'draft',
      title: 'PRIVATE_TITLE_CANARY',
      body: 'PRIVATE_BODY_CANARY',
      featured: true,
    })
    const revision = { ...published, status: 'draft' as const, body: 'PRIVATE_REVISION_CANARY' }
    setContent([published, privateEntry], [revision])
    render(<Page />)
    expect(screen.getByText('公开版本正文')).toBeTruthy()
    expect(document.body.textContent).not.toContain('PRIVATE_')

    for (const route of ['/', '/archive?view=list', `/entry/${published.id}`]) {
      const html = serverRender(route)
      expect(html).toContain(published.title)
      expect(html).not.toContain('PRIVATE_')
      expect(html).not.toContain(privateEntry.id)
      expect(html).not.toContain('href="#/')
    }
    const hidden = serverRender(`/entry/${privateEntry.id}`)
    expect(hidden).toContain('内容暂时不可用')
    expect(hidden).not.toContain('PRIVATE_')
  })

  it('renders the empty production homepage without browser globals or hardcoded identity', () => {
    const html = serverRender()
    expect(html).toContain(settings.name)
    expect(html).toContain(settings.intro)
    expect(html).toContain('href="/writing"')
    expect(html).toContain('href="/notes"')
    expect(html).not.toContain('href="#/')
    expect(html).not.toContain('Myshkin 451')
  })
})

describe('public collection type navigation', () => {
  it.each(['/archive', '/writing'])(
    'preserves search, topic and list view when leaving %s for another content type',
    (path) => {
      const topic = '观察 & 回忆'
      const writing = makeEntry({ title: '海与光：文字', topics: [topic] })
      const photo = makeEntry({ kind: 'photo', title: '海与光：影像', topics: [topic] })
      const unrelated = makeEntry({ kind: 'photo', title: '山间的清晨', topics: ['其他'] })
      setContent([writing, photo, unrelated])
      const params = new URLSearchParams({
        kind: 'writing',
        q: '海与光',
        topic,
        view: 'list',
        selected: writing.id,
      })
      const route = `${path}?${params}`
      window.history.replaceState(null, '', route)
      const view = render(<Page route={route} />)
      const types = within(screen.getByRole('navigation', { name: '按内容类型筛选' }))
      const href = types.getByRole('link', { name: /^影像/ }).getAttribute('href')!
      const destination = new URL(href, 'https://example.test')
      expect(destination.pathname).toBe('/photos')
      expect(destination.searchParams.get('q')).toBe('海与光')
      expect(destination.searchParams.get('topic')).toBe(topic)
      expect(destination.searchParams.get('view')).toBe('list')
      expect(destination.searchParams.has('kind')).toBe(false)
      expect(destination.searchParams.has('selected')).toBe(false)

      window.history.replaceState(null, '', href)
      view.rerender(<Page route={href} />)
      expect((screen.getByRole('searchbox', { name: '搜索内容' }) as HTMLInputElement).value).toBe(
        '海与光',
      )
      expect(screen.getByRole('button', { name: '目录视图' }).getAttribute('aria-pressed')).toBe(
        'true',
      )
      expect(screen.getByRole('button', { name: topic }).getAttribute('aria-pressed')).toBe('true')
      expect(screen.getByRole('heading', { name: photo.title })).toBeTruthy()
      expect(screen.queryByText(unrelated.title)).toBeNull()
      expect(screen.getByRole('link', { name: '查看内容' }).getAttribute('href')).toBe(
        `/entry/${photo.id}`,
      )
    },
  )
})
