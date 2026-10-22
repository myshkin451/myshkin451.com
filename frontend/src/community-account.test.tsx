// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CommunityPage } from './pages/Community'
import { initialState } from './model'
import { defaultSettings } from './seed'
import type { Platform } from './types'
import { go } from './navigation'

const fixture = vi.hoisted(() => ({ platform: {} as Platform }))
vi.mock('./platform', () => ({ usePlatform: () => fixture.platform }))
vi.mock('./navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./navigation')>()),
  go: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  fixture.platform = {
    remote: true,
    authReady: true,
    isOwner: false,
    auth: {
      emailEnabled: false,
      githubEnabled: false,
      recoveryPending: false,
      login: vi.fn().mockResolvedValue(undefined),
      register: vi.fn().mockResolvedValue(undefined),
      recover: vi.fn().mockResolvedValue(undefined),
      updatePassword: vi.fn().mockResolvedValue(undefined),
      resendConfirmation: vi.fn().mockResolvedValue(undefined),
      signInWithGithub: vi.fn().mockResolvedValue(undefined),
      saveProfile: vi.fn().mockResolvedValue(undefined),
    },
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

function renderAuth(path = '/login', destination?: string) {
  return render(
    <CommunityPage
      path={path}
      params={new URLSearchParams(destination ? { return: destination } : {})}
    />,
  )
}

describe('remote account entry points', () => {
  it('offers useful exits instead of unavailable email actions', () => {
    renderAuth()
    expect(screen.queryByRole('textbox', { name: '邮箱' })).toBeNull()
    expect(screen.queryByRole('link', { name: '注册账号' })).toBeNull()
    expect(screen.queryByRole('link', { name: '忘记密码' })).toBeNull()
    expect(screen.getByText('邮箱登录、注册与找回暂未开放。')).toBeTruthy()
    expect(screen.getByRole('link', { name: '返回首页' }).getAttribute('href')).toBe('/')
    expect(screen.getByRole('link', { name: '进入学习室' }).getAttribute('href')).toBe('/study')
  })

  it.each(['/register', '/recover', '/auth/callback'])(
    'preserves a return to login from %s when email is closed',
    (path) => {
      renderAuth(path, '/studio/notes?draft=example')
      expect(screen.getByRole('link', { name: '返回登录' }).getAttribute('href')).toBe(
        '/login?return=%2Fstudio%2Fnotes%3Fdraft%3Dexample',
      )
      expect(screen.getByRole('link', { name: '返回首页' })).toBeTruthy()
      expect(screen.getByRole('link', { name: '进入学习室' })).toBeTruthy()
      expect(screen.queryByRole('button', { name: '发送找回邮件' })).toBeNull()
      expect(screen.queryByRole('button', { name: '注册并发送验证邮件' })).toBeNull()
    },
  )

  it('explains owner login and preserves the requested publishing destination', async () => {
    fixture.platform.auth!.emailEnabled = true
    renderAuth('/login', '/studio/notes?draft=example')
    expect(screen.getByRole('heading', { name: '站主登录' })).toBeTruthy()
    expect(screen.getByText('使用已获授权的站主账号，继续发布和管理内容。')).toBeTruthy()
    expect(screen.getByRole('link', { name: '注册账号' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '忘记密码' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('邮箱'), { target: { value: 'owner@example.test' } })
    fireEvent.change(screen.getByLabelText('密码'), { target: { value: 'test-only-password' } })
    fireEvent.click(screen.getByRole('button', { name: '登录' }))
    await waitFor(() => expect(go).toHaveBeenCalledWith('/studio/notes?draft=example'))
    expect(fixture.platform.auth!.login).toHaveBeenCalledWith(
      'owner@example.test',
      'test-only-password',
    )
  })

  it('keeps visitor guidance and rejects an external return destination', () => {
    fixture.platform.auth!.emailEnabled = true
    renderAuth('/login', '//example.test/studio')
    expect(screen.getByRole('heading', { name: '登录' })).toBeTruthy()
    expect(screen.getByText('公开阅读无需账号。登录后可以留言和管理自己的留言。')).toBeTruthy()
    expect(screen.getByRole('link', { name: '注册账号' }).getAttribute('href')).toBe(
      '/register?return=%2Fguestbook',
    )
  })

  it('retains an available GitHub sign-in while email actions are closed', async () => {
    fixture.platform.auth!.githubEnabled = true
    renderAuth('/login', '/studio/notes')
    fireEvent.click(screen.getByRole('button', { name: '使用 GitHub 登录' }))
    await waitFor(() =>
      expect(fixture.platform.auth!.signInWithGithub).toHaveBeenCalledWith('/studio/notes'),
    )
    expect(screen.queryByRole('link', { name: '注册账号' })).toBeNull()
  })

  it('lets a signed-in owner continue to the requested workspace without another login', () => {
    fixture.platform.auth!.emailEnabled = true
    fixture.platform.isOwner = true
    fixture.platform.state.visitor = { id: 'owner', nickname: '站主' }
    renderAuth('/login', '/studio/notes')
    expect(screen.getByRole('heading', { name: '已登录' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '进入工作台' }).getAttribute('href')).toBe(
      '/studio/notes',
    )
    expect(screen.queryByLabelText('邮箱')).toBeNull()
    expect(screen.queryByRole('button', { name: '重新发送验证邮件' })).toBeNull()
    expect(screen.queryByRole('link', { name: '注册账号' })).toBeNull()
  })

  it('does not present a workspace action to a signed-in visitor requesting an owner route', () => {
    fixture.platform.state.visitor = { id: 'visitor', nickname: '访客' }
    renderAuth('/login', '/studio/notes')
    expect(screen.getByText('当前账号没有工作台权限，可以继续浏览公开内容。')).toBeTruthy()
    expect(screen.getByRole('link', { name: '继续浏览' }).getAttribute('href')).toBe('/')
    expect(screen.getByRole('link', { name: '← 返回' }).getAttribute('href')).toBe('/')
    expect(screen.queryByRole('link', { name: '进入工作台' })).toBeNull()
    expect(screen.queryByLabelText('邮箱')).toBeNull()
  })

  it('keeps password recovery available for an active recovery session even with email closed', async () => {
    fixture.platform.auth!.recoveryPending = true
    fixture.platform.state.visitor = { id: 'visitor', nickname: '访客' }
    renderAuth('/login')
    expect(screen.getByRole('heading', { name: '设置新密码' })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('新密码'), { target: { value: 'new-test-password' } })
    fireEvent.change(screen.getByLabelText('再次输入密码'), {
      target: { value: 'new-test-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: '保存新密码' }))
    await waitFor(() =>
      expect(fixture.platform.auth!.updatePassword).toHaveBeenCalledWith('new-test-password'),
    )
  })
})
