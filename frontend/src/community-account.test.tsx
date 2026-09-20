// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CommunityPage } from './pages/Community'
import { initialState } from './model'
import { defaultSettings } from './seed'
import type { Platform } from './types'

const fixture = vi.hoisted(() => ({ platform: {} as Platform }))
vi.mock('./platform', () => ({ usePlatform: () => fixture.platform }))

beforeEach(() => {
  fixture.platform = {
    remote: true,
    state: initialState(defaultSettings),
    entries: [],
    drafts: [],
  } as unknown as Platform
})
afterEach(cleanup)

const account = <CommunityPage path="/account" params={new URLSearchParams()} />

describe('account nickname hydration', () => {
  it('prefills a profile arriving after initial render and follows refresh until the visitor edits', () => {
    const view = render(account)
    expect(screen.queryByRole('textbox', { name: '昵称' })).toBeNull()
    fixture.platform.state.visitor = { id: 'visitor-a', nickname: '已有昵称' }
    view.rerender(<CommunityPage path="/account" params={new URLSearchParams()} />)
    const input = screen.getByRole('textbox', { name: '昵称' }) as HTMLInputElement
    expect(input.value).toBe('已有昵称')
    fixture.platform.state.visitor = { id: 'visitor-a', nickname: '服务端更新' }
    view.rerender(<CommunityPage path="/account" params={new URLSearchParams()} />)
    expect(input.value).toBe('服务端更新')
  })

  it('preserves a typed nickname across background refresh and isolates edits by visitor identity', () => {
    fixture.platform.state.visitor = { id: 'visitor-a', nickname: '已有昵称' }
    const view = render(account)
    const input = screen.getByRole('textbox', { name: '昵称' }) as HTMLInputElement
    fireEvent.change(input, { target: { value: '我正在修改' } })
    fixture.platform.state.visitor = { id: 'visitor-a', nickname: '后台刷新' }
    view.rerender(<CommunityPage path="/account" params={new URLSearchParams()} />)
    expect(input.value).toBe('我正在修改')
    fixture.platform.state.visitor = { id: 'visitor-b', nickname: '另一个访客' }
    view.rerender(<CommunityPage path="/account" params={new URLSearchParams()} />)
    expect(input.value).toBe('另一个访客')
  })
})
