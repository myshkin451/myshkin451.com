// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NavigationProvider } from './navigation'
import { PublicPage } from './pages/Public'
import { initialState } from './model'
import { defaultSettings } from './seed'
import { newEntry, type Platform } from './types'

const fixture = vi.hoisted(() => ({ platform: {} as Platform }))
vi.mock('./platform', () => ({ usePlatform: () => fixture.platform }))

beforeEach(() => {
  sessionStorage.clear()
  const entry = {
    ...newEntry(),
    id: 'entry-1',
    title: '文章',
    body: '正文',
    status: 'published' as const,
    discussion: false,
  }
  fixture.platform = {
    remote: true,
    entries: [entry],
    drafts: [],
    state: { ...initialState(defaultSettings), entries: [entry] },
  } as unknown as Platform
  document.body.dataset.routing = 'path'
})
afterEach(() => {
  cleanup()
  delete document.body.dataset.routing
})

function EntryView() {
  return (
    <NavigationProvider route="/entry/entry-1">
      <PublicPage path="/entry/entry-1" params={new URLSearchParams()} />
    </NavigationProvider>
  )
}

describe('collection return across document navigation', () => {
  it('saves filters and selected content then restores them when entry is rendered independently', () => {
    const query = 'kind=writing&q=%E6%B5%B7&view=list&selected=entry-1'
    window.history.replaceState(null, '', `/archive?${query}`)
    const collection = render(
      <NavigationProvider route={`/archive?${query}`}>
        <PublicPage path="/archive" params={new URLSearchParams(query)} />
      </NavigationProvider>,
    )
    expect(sessionStorage.getItem('myshkin-last-collection')).toBe(`#/archive?${query}`)
    collection.unmount()
    window.history.replaceState(null, '', '/entry/entry-1')
    render(<EntryView />)
    expect(screen.getByRole('link', { name: '返回内容' }).getAttribute('href')).toBe(
      `/archive?${query}`,
    )
  })

  it('restores a collection from session storage without a prior collection mount', () => {
    sessionStorage.setItem('myshkin-last-collection', '#/photos?view=list&selected=photo-id')
    render(<EntryView />)
    expect(screen.getByRole('link', { name: '返回内容' }).getAttribute('href')).toBe(
      '/photos?view=list&selected=photo-id',
    )
  })

  it.each([
    'https://evil.example/',
    '//evil.example/',
    '#//evil.example/',
    'javascript:alert(1)',
    '#/\\evil.example/',
    '#/studio',
    '#/entry/other',
  ])('rejects an unsafe or unrelated stored return: %s', (value) => {
    sessionStorage.setItem('myshkin-last-collection', value)
    render(<EntryView />)
    expect(screen.getByRole('link', { name: '返回内容' }).getAttribute('href')).toBe('/')
  })

  it('renders a deterministic safe server link without reading browser return state', () => {
    sessionStorage.setItem('myshkin-last-collection', '#/archive?q=private-query')
    const html = renderToString(<EntryView />)
    expect(html).toContain('href="/"')
    expect(html).not.toContain('private-query')
  })
})
