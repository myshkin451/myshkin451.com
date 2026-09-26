// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { useRemotePlatform } from './remote-platform'
import { initialState } from './model'
import { defaultSettings } from './seed'
import { newEntry, type StoredState } from './types'

const fixture = vi.hoisted(() => ({
  user: null as null | { id: string; user_metadata?: Record<string, unknown> },
  owner: false,
  restricted: false,
  confirmed: true,
  failing: '',
  authError: null as null | { name?: string; code?: string; message: string; status?: number },
  messages: [] as unknown[],
  range: vi.fn(),
  drafts: [] as { id: string; data: unknown }[],
  entries: [] as { id: string; data: unknown }[],
  listener: null as null | ((event: string) => void),
  from: vi.fn(),
  rpc: vi.fn(),
  upload: vi.fn(),
  signed: vi.fn(),
  signup: vi.fn(),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: fixture.authError ? null : fixture.user },
        error: fixture.authError,
      }),
      onAuthStateChange: (listener: (event: string) => void) => {
        fixture.listener = listener
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      },
      signOut: async () => {
        fixture.user = null
        fixture.listener?.('SIGNED_OUT')
        return { error: null }
      },
      signUp: fixture.signup,
      updateUser: async () => ({ error: null }),
    },
    from: fixture.from,
    rpc: fixture.rpc,
    storage: { from: () => ({ upload: fixture.upload, createSignedUrl: fixture.signed }) },
  }),
}))

const config = { url: 'https://example.supabase.co', key: 'public-test-key' }

beforeEach(() => {
  vi.clearAllMocks()
  fixture.user = null
  fixture.owner = false
  fixture.restricted = false
  fixture.confirmed = true
  fixture.failing = ''
  fixture.authError = null
  fixture.messages = []
  fixture.drafts = []
  fixture.entries = []
  fixture.rpc.mockImplementation(async (name: string) => ({
    error:
      name === 'account_status' && fixture.failing === 'account_status'
        ? { message: 'Network unavailable' }
        : null,
    data:
      name === 'account_status' && fixture.user
        ? {
            id: fixture.user.id,
            email: 'fixture@example.test',
            email_confirmed_at: fixture.confirmed ? '2026-09-01' : null,
            role: fixture.owner ? 'owner' : 'visitor',
            restricted: fixture.restricted,
            created_at: '2026-09-01',
          }
        : null,
  }))
  fixture.upload.mockResolvedValue({ error: null, data: {} })
  fixture.signup.mockResolvedValue({ error: null, data: { session: null } })
  fixture.signed.mockImplementation(async (path: string) => ({
    error: null,
    data: { signedUrl: `https://example.supabase.co/private/${path}?token=private-test` },
  }))
  fixture.from.mockImplementation((table: string) => {
    const result = {
      error: fixture.failing === table ? { message: 'Network unavailable' } : null,
      data:
        table === 'site_owners'
          ? fixture.owner
            ? { user_id: fixture.user?.id }
            : null
          : table === 'profiles'
            ? { id: fixture.user?.id, nickname: '真实访客' }
            : table === 'site_settings'
              ? { data: defaultSettings }
              : table === 'published_entries'
                ? fixture.entries
                : table === 'entry_drafts'
                  ? fixture.drafts
                  : fixture.messages,
    }
    let range: [number, number] | null = null
    const builder: Record<string, unknown> = {
      then: (resolve: (result: unknown) => unknown) =>
        Promise.resolve({
          ...result,
          data:
            range && Array.isArray(result.data)
              ? result.data.slice(range[0], range[1] + 1)
              : result.data,
        }).then(resolve),
      range: (start: number, end: number) => {
        fixture.range(table, start, end)
        range = [start, end]
        return builder
      },
    }
    for (const method of ['select', 'eq', 'single', 'maybeSingle', 'order'])
      builder[method] = () => builder
    return builder
  })
})

afterEach(cleanup)

describe('shared platform boundaries', () => {
  it.each(['restricted', 'unverified'])(
    'removes owner access when account becomes %s',
    async (reason) => {
      fixture.user = { id: 'owner' }
      fixture.owner = true
      fixture.drafts = [{ id: 'draft', data: { ...newEntry(), title: '私有草稿' } }]
      const { result } = renderHook(() => useRemotePlatform(config))
      await waitFor(() => expect(result.current.isOwner).toBe(true))
      if (reason === 'restricted') fixture.restricted = true
      else fixture.confirmed = false
      await act(() => result.current.refresh!())
      expect(result.current.isOwner).toBe(false)
      expect(result.current.drafts).toEqual([])
    },
  )

  it('sends a title-free note through the real adapter while preserving article validation', async () => {
    fixture.user = { id: 'owner' }
    fixture.owner = true
    const { result } = renderHook(() => useRemotePlatform(config))
    await waitFor(() => expect(result.current.isOwner).toBe(true))
    await act(() => result.current.publishEntry({ ...newEntry('note'), body: '可以直接发表' }))
    expect(fixture.rpc).toHaveBeenCalledWith(
      'save_entry',
      expect.objectContaining({
        publish: true,
        entry: expect.objectContaining({ kind: 'note', title: '', body: '可以直接发表' }),
      }),
    )
    await expect(result.current.publishEntry(newEntry('note'))).rejects.toThrow('内容')
    await expect(
      result.current.publishEntry({ ...newEntry('writing'), body: '长文' }),
    ).rejects.toThrow('标题')
  })

  it('does not fetch drafts for anonymous readers or a visitor with forged owner metadata', async () => {
    const { result } = renderHook(() => useRemotePlatform(config))
    await waitFor(() => expect(result.current.authReady).toBe(true))
    expect(fixture.from).not.toHaveBeenCalledWith('entry_drafts')
    fixture.user = { id: 'visitor', user_metadata: { role: 'admin', isOwner: true } }
    await act(() => result.current.refresh!())
    expect(result.current.state.visitor?.id).toBe('visitor')
    expect(result.current.isOwner).toBe(false)
    expect(fixture.from).not.toHaveBeenCalledWith('entry_drafts')
    await expect(result.current.saveDraft(newEntry())).rejects.toThrow('站主')
    expect(fixture.rpc.mock.calls.every(([name]) => name === 'account_status')).toBe(true)
  })

  it('preserves server-rendered public content and reports load failure instead of claiming an empty site', async () => {
    const publicEntry = { ...newEntry(), title: '已经发布', status: 'published' as const }
    const initial: StoredState = { ...initialState(defaultSettings), entries: [publicEntry] }
    fixture.failing = 'published_entries'
    const { result } = renderHook(() => useRemotePlatform(config, initial))
    await waitFor(() => expect(result.current.error).toContain('连接服务'))
    expect(result.current.entries[0].title).toBe('已经发布')
    expect(result.current.isOwner).toBe(false)
    expect(result.current.drafts).toEqual([])
  })

  it.each(['account_status', 'published_entries', 'auth'])(
    'keeps verified owner and unsaved editor mounted when %s refresh is unavailable',
    async (table) => {
      fixture.user = { id: 'owner' }
      fixture.owner = true
      const draft = { ...newEntry(), title: '已保存草稿' }
      fixture.drafts = [{ id: draft.id, data: draft }]
      function Editor() {
        const [body, setBody] = useState('')
        return (
          <textarea
            aria-label="未保存正文"
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        )
      }
      function Harness() {
        const platform = useRemotePlatform(config)
        return (
          <>
            {platform.isOwner && <Editor />}
            <span>{platform.state.visitor?.id}</span>
            <span>{platform.drafts[0]?.title}</span>
            {platform.error && <p role="alert">{platform.error}</p>}
          </>
        )
      }
      render(<Harness />)
      const editor = await screen.findByLabelText('未保存正文')
      fireEvent.change(editor, { target: { value: '尚未保存，必须保留。' } })
      if (table === 'auth')
        fixture.authError = {
          name: 'AuthRetryableFetchError',
          message: 'Network unavailable',
          status: 503,
        }
      else fixture.failing = table
      fireEvent(window, new Event('focus'))
      await screen.findByRole('alert')
      expect(screen.getByLabelText('未保存正文')).toBe(editor)
      expect((editor as HTMLTextAreaElement).value).toBe('尚未保存，必须保留。')
      expect(screen.getByText('owner')).toBeTruthy()
      expect(screen.getByText('已保存草稿')).toBeTruthy()
    },
  )

  it('clears verified private state after an explicit revoked session response even if public refresh fails', async () => {
    fixture.user = { id: 'owner' }
    fixture.owner = true
    const draft = newEntry()
    fixture.drafts = [{ id: draft.id, data: draft }]
    const { result } = renderHook(() => useRemotePlatform(config))
    await waitFor(() => expect(result.current.isOwner).toBe(true))
    fixture.authError = {
      name: 'AuthApiError',
      code: 'session_not_found',
      message: 'Session revoked',
      status: 401,
    }
    await act(async () => {
      await expect(result.current.refresh!()).rejects.toThrow('Session revoked')
    })
    expect(result.current.isOwner).toBe(false)
    expect(result.current.state.visitor).toBeNull()
    expect(result.current.drafts).toEqual([])
  })

  it('clears drafts when owner permission is confirmed revoked even if a later public query fails', async () => {
    fixture.user = { id: 'owner' }
    fixture.owner = true
    const draft = newEntry()
    fixture.drafts = [{ id: draft.id, data: draft }]
    const { result } = renderHook(() => useRemotePlatform(config))
    await waitFor(() => expect(result.current.isOwner).toBe(true))
    fixture.owner = false
    fixture.restricted = false
    fixture.confirmed = true
    fixture.failing = 'published_entries'
    await act(async () => {
      await expect(result.current.refresh!()).rejects.toThrow('连接服务')
    })
    expect(result.current.isOwner).toBe(false)
    expect(result.current.drafts).toEqual([])
  })

  it('does not trust initial private data when first-load verification fails', async () => {
    const draft = newEntry()
    const initial: StoredState = {
      ...initialState(defaultSettings),
      drafts: [draft],
      visitor: { id: 'owner', nickname: '站主' },
      messages: [
        {
          id: 'private',
          targetId: 'guestbook',
          authorId: 'owner',
          authorName: '站主',
          body: '私有留言',
          createdAt: '',
          parentId: null,
          hidden: true,
          status: 'hidden',
        },
      ],
    }
    fixture.authError = {
      name: 'AuthRetryableFetchError',
      message: 'Network unavailable',
      status: 503,
    }
    const { result } = renderHook(() => useRemotePlatform(config, initial))
    await waitFor(() => expect(result.current.error).toContain('连接服务'))
    expect(result.current.isOwner).toBe(false)
    expect(result.current.state.visitor).toBeNull()
    expect(result.current.drafts).toEqual([])
    expect(result.current.state.messages).toEqual([])
  })

  it('loads entries, drafts and pending messages beyond the response limit in deterministic pages', async () => {
    fixture.user = { id: 'owner' }
    fixture.owner = true
    const rows = Array.from({ length: 1001 }, (_, index) => ({
      id: String(index).padStart(4, '0'),
      data: { ...newEntry(), title: `内容 ${index}` },
    }))
    fixture.entries = rows
    fixture.drafts = rows
    fixture.messages = rows.map(({ id }, index) => ({
      id,
      target_id: 'guestbook',
      author_id: 'visitor',
      author_name: '读者',
      body: `留言 ${index}`,
      created_at: new Date(index * 1000).toISOString(),
      parent_id: null,
      status: index === 1000 ? 'pending' : 'approved',
    }))
    const { result } = renderHook(() => useRemotePlatform(config))
    await waitFor(() => expect(result.current.isOwner).toBe(true))
    expect(result.current.entries).toHaveLength(1001)
    expect(result.current.drafts).toHaveLength(1001)
    expect(result.current.state.messages).toHaveLength(1001)
    expect(result.current.state.messages.at(-1)?.status).toBe('pending')
    for (const table of ['published_entries', 'entry_drafts', 'messages']) {
      expect(fixture.range).toHaveBeenCalledWith(table, 1000, 1499)
    }
  })

  it('uploads immutable media once and submits canonical cover and photo paths', async () => {
    fixture.user = { id: 'owner' }
    fixture.owner = true
    const { result } = renderHook(() => useRemotePlatform(config))
    await waitFor(() => expect(result.current.isOwner).toBe(true))
    const image = 'data:image/png;base64,aW1hZ2U='
    const entry = {
      ...newEntry('photo'),
      title: '照片',
      cover: image,
      photos: [{ id: 'photo', src: image, alt: '照片', caption: '' }],
    }
    await act(() => result.current.publishEntry(entry))
    expect(fixture.upload).toHaveBeenCalledTimes(1)
    expect(fixture.upload.mock.calls[0][2].upsert).toBe(false)
    const saved = fixture.rpc.mock.calls.find(([name]) => name === 'save_entry')![1].entry
    expect(saved.cover).toMatch(/^\/media\/[0-9a-f-]+\.png$/)
    expect(saved.photos[0].src).toBe(saved.cover)
    expect(saved.sample).toBe(false)
    expect(JSON.stringify(saved)).not.toContain('data:image')
  })

  it('never writes signed draft URLs and removes owner data on sign-out', async () => {
    fixture.user = { id: 'owner' }
    fixture.owner = true
    const src = '/media/12345678-1234-1234-1234-123456789012.png'
    const entry = {
      ...newEntry('photo'),
      title: '秘密草稿',
      cover: src,
      photos: [{ id: 'photo', src, alt: '', caption: '' }],
    }
    fixture.drafts = [{ id: entry.id, data: entry }]
    const { result } = renderHook(() => useRemotePlatform(config))
    await waitFor(() => expect(result.current.drafts).toHaveLength(1))
    expect(result.current.drafts[0].cover).toContain('token=private-test')
    await act(() => result.current.saveDraft(result.current.drafts[0]))
    const saved = fixture.rpc.mock.calls.find(([name]) => name === 'save_entry')![1].entry
    expect(saved.cover).toBe(src)
    expect(saved.photos[0]).toEqual(entry.photos[0])
    expect(JSON.stringify(saved)).not.toContain('token=')
    expect(fixture.upload).not.toHaveBeenCalled()
    fixture.owner = false
    fixture.restricted = false
    fixture.confirmed = true
    await act(() => result.current.signOut())
    expect(result.current.isOwner).toBe(false)
    expect(result.current.state.visitor).toBeNull()
    expect(result.current.drafts).toEqual([])
  })

  it('tracks actual recovery events and sends signup verification to a same-origin callback', async () => {
    const { result } = renderHook(() => useRemotePlatform(config))
    await waitFor(() => expect(result.current.authReady).toBe(true))
    expect(result.current.auth!.recoveryPending).toBe(false)
    act(() => fixture.listener?.('PASSWORD_RECOVERY'))
    expect(result.current.auth!.recoveryPending).toBe(true)
    await expect(result.current.auth!.updatePassword('example-password')).rejects.toThrow(
      '验证会话已失效',
    )
    await act(() =>
      result.current.auth!.register('visitor@example.invalid', 'example-password', '读者'),
    )
    expect(fixture.signup.mock.calls[0][0].options).toEqual({
      data: { nickname: '读者' },
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    })
  })
})
