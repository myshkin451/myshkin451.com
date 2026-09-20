// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CommunityPage } from './pages/Community'
import { NavigationProvider } from './navigation'
import { ConfirmProvider } from './Confirm'
import { initialState, publishEntry, restoreState, saveDraft, unpublishEntry } from './model'
import { noteDate, publicNotes } from './notes'
import { Notes, NoteText } from './pages/Notes'
import { NoteWorkspace } from './pages/NoteWorkspace'
import { PublicPage } from './pages/Public'
import { defaultSettings } from './seed'
import { newEntry, type Entry, type Platform } from './types'

const fixture = vi.hoisted(() => ({ platform: {} as Platform }))
vi.mock('./platform', () => ({ usePlatform: () => fixture.platform }))
const now = '2026-09-20T16:30:00.000Z'
const later = '2026-09-22T03:00:00.000Z'
const makeNote = (body = '一条随记') => ({ ...newEntry('note'), body })
beforeEach(() => {
  fixture.platform = {
    remote: true,
    isOwner: false,
    entries: [],
    drafts: [],
    state: initialState(defaultSettings),
    saveDraft: vi.fn().mockResolvedValue(undefined),
    publishEntry: vi.fn().mockImplementation(async (entry: Entry) => {
      fixture.platform.entries = [
        { ...entry, status: 'published', publishedAt: now },
        ...fixture.platform.entries.filter((item) => item.id !== entry.id),
      ]
      fixture.platform.drafts = fixture.platform.drafts.filter((item) => item.id !== entry.id)
    }),
  } as unknown as Platform
})
afterEach(cleanup)

describe('title-free notes and publication boundaries', () => {
  it('publishes without a title and retains isolation through edit, reload and withdrawal', () => {
    const note = makeNote()
    const published = publishEntry(initialState(defaultSettings), [], note, now)
    expect(published.entries[0].title).toBe('')
    expect(published.entries[0].discussion).toBe(false)
    const draft = saveDraft(published, [], { ...note, body: '未公开' }, later)
    expect(restoreState(draft).entries[0].body).toBe('一条随记')
    const updated = publishEntry(draft, [], draft.drafts[0], later)
    expect(updated.entries[0].publishedAt).toBe(now)
    const withdrawn = unpublishEntry(updated, [], note.id, later)
    expect(publicNotes(withdrawn.entries)).toEqual([])
    expect(withdrawn.drafts[0].body).toBe('未公开')
  })
  it('rejects blank notes and over-limit input, counts emoji like the database', () => {
    const empty = initialState(defaultSettings)
    expect(() => publishEntry(empty, [], makeNote(' \n\t'), now)).toThrow()
    expect(() => publishEntry(empty, [], makeNote('🌙'.repeat(5001)), now)).toThrow()
    expect(publishEntry(empty, [], makeNote('🌙'.repeat(5000)), now).entries).toHaveLength(1)
    expect(() => publishEntry(empty, [], { ...newEntry('writing'), body: '无标题' }, now)).toThrow()
  })
  it('uses the same calendar across server and reader time zones', () => {
    expect(noteDate(now)).toEqual({
      year: '2026',
      month: '09',
      day: '21',
      time: '00:30',
      key: '2026-09',
    })
  })
})

describe('public notes', () => {
  it('waits for identity before deciding that a private draft is missing', () => {
    const props = { path: '/entry/private-note', params: new URLSearchParams('draft=1') }
    const view = render(<PublicPage {...props} />)
    expect(screen.getByRole('status').textContent).toBe('正在读取草稿…')
    expect(screen.queryByText('没有找到这份草稿')).toBeNull()
    fixture.platform.authReady = true
    view.rerender(<PublicPage {...props} />)
    expect(screen.getByText('没有找到这份草稿')).toBeTruthy()
  })
  it('shows an honest empty state without owner tools for visitors', () => {
    render(<Notes params={new URLSearchParams()} />)
    expect(screen.getByText('还没有公开的随记。')).toBeTruthy()
    expect(screen.queryByRole('link', { name: '写一条' })).toBeNull()
    expect(screen.queryByRole('textbox')).toBeNull()
  })
  it('filters by topic and month and never includes drafts or articles', () => {
    const entry = {
      ...makeNote('九月的公开文字'),
      topics: ['日常'],
      status: 'published' as const,
      publishedAt: now,
    }
    fixture.platform.entries = [
      entry,
      { ...entry, id: 'other', body: '八月', publishedAt: '2026-08-01T00:00:00Z' },
      { ...entry, id: 'draft', body: '私密文字', status: 'draft' },
      { ...entry, id: 'article', body: '长文', kind: 'writing' },
    ]
    render(<Notes params={new URLSearchParams('month=2026-09&topic=日常')} />)
    expect(screen.getByText('九月的公开文字')).toBeTruthy()
    expect(screen.queryByText('八月')).toBeNull()
    expect(screen.queryByText('私密文字')).toBeNull()
    expect(screen.queryByText('长文')).toBeNull()
  })
  it('expands a long note without navigating', () => {
    fixture.platform.entries = [
      { ...makeNote('字'.repeat(490) + '最后一句'), status: 'published', publishedAt: now },
    ]
    render(<Notes params={new URLSearchParams()} />)
    expect(screen.queryByText(/最后一句/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: '展开全文' }))
    expect(screen.getByText(/最后一句/)).toBeTruthy()
    expect(screen.getByRole('button', { name: '收起' }).getAttribute('aria-expanded')).toBe('true')
  })
  it('renders HTML as text and only links safe explicit URLs', () => {
    const { container } = render(
      <NoteText
        body={'<img src=x onerror=alert(1)> javascript:alert(1)\nhttps://example.com/path。'}
      />,
    )
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByRole('link').getAttribute('href')).toBe('https://example.com/path')
  })
})

describe('quick note composer', () => {
  const setup = () =>
    render(
      <ConfirmProvider>
        <NoteWorkspace params={new URLSearchParams()} />
      </ConfirmProvider>,
    )
  it('publishes text with a stable ID, then clears the composer on success', async () => {
    setup()
    fireEvent.change(screen.getByRole('textbox', { name: '随记正文' }), {
      target: { value: '刚写的文字' },
    })
    fireEvent.click(screen.getByRole('button', { name: '发布' }))
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('已发布'))
    expect(fixture.platform.publishEntry).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'note', title: '', body: '刚写的文字', discussion: false }),
    )
    expect((screen.getByRole('textbox', { name: '随记正文' }) as HTMLTextAreaElement).value).toBe(
      '',
    )
  })
  it('labels a saved revision as private and drops the public link after withdrawal', async () => {
    const entry = { ...makeNote('已公开的文字'), status: 'published' as const, publishedAt: now }
    fixture.platform.entries = [entry]
    fixture.platform.drafts = [{ ...entry, body: '私下修改', status: 'draft' }]
    const params = new URLSearchParams({ edit: entry.id })
    const view = render(
      <ConfirmProvider>
        <NoteWorkspace params={params} />
      </ConfirmProvider>,
    )
    expect(screen.getByText('修改未发布')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '发布修改' }))
    await waitFor(() => expect(screen.getByRole('link', { name: '查看' })).toBeTruthy())
    fixture.platform.drafts = [{ ...entry, body: '私下修改', status: 'draft' }]
    fixture.platform.entries = []
    view.rerender(
      <ConfirmProvider>
        <NoteWorkspace params={params} />
      </ConfirmProvider>,
    )
    expect(screen.queryByRole('link', { name: '查看' })).toBeNull()
    expect(screen.queryByText('修改已发布。')).toBeNull()
    expect(screen.getByText('仅你可见')).toBeTruthy()
    expect((screen.getByRole('textbox', { name: '随记正文' }) as HTMLTextAreaElement).value).toBe(
      '私下修改',
    )
  })
  it('keeps the entire text after a failed save and allows retry', async () => {
    vi.mocked(fixture.platform.publishEntry).mockRejectedValueOnce(new Error('网络暂时不可用'))
    setup()
    fireEvent.change(screen.getByRole('textbox', { name: '随记正文' }), {
      target: { value: '必须保留的文字' },
    })
    fireEvent.click(screen.getByRole('button', { name: '发布' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('网络暂时不可用'))
    expect((screen.getByRole('textbox', { name: '随记正文' }) as HTMLTextAreaElement).value).toBe(
      '必须保留的文字',
    )
    fireEvent.click(screen.getByRole('button', { name: '发布' }))
    await waitFor(() => expect(fixture.platform.publishEntry).toHaveBeenCalledTimes(2))
  })
  it('prevents duplicate submissions while a request is unresolved', async () => {
    let complete!: () => void
    vi.mocked(fixture.platform.publishEntry).mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          complete = () => {
            const entry = vi.mocked(fixture.platform.publishEntry).mock.calls[0][0]
            fixture.platform.entries = [{ ...entry, status: 'published', publishedAt: now }]
            resolve()
          }
        }),
    )
    setup()
    const textarea = screen.getByRole('textbox', { name: '随记正文' })
    fireEvent.change(textarea, { target: { value: '只发一次' } })
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true })
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true })
    expect(fixture.platform.publishEntry).toHaveBeenCalledTimes(1)
    complete()
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('已发布'))
  })
  it('saves to private drafts without publishing or erasing the text', async () => {
    setup()
    fireEvent.change(screen.getByRole('textbox', { name: '随记正文' }), {
      target: { value: '未完成' },
    })
    fireEvent.click(screen.getByRole('button', { name: '存草稿' }))
    await waitFor(() => expect(fixture.platform.saveDraft).toHaveBeenCalledTimes(1))
    expect(fixture.platform.publishEntry).not.toHaveBeenCalled()
    expect((screen.getByRole('textbox', { name: '随记正文' }) as HTMLTextAreaElement).value).toBe(
      '未完成',
    )
  })
})

it.each(['/studio/notes?edit=note-id', '/notes?month=2026-09'])(
  'preserves the notes destination %s across login',
  (destination) => {
    fixture.platform.authReady = true
    fixture.platform.auth = { emailEnabled: false, githubEnabled: false } as Platform['auth']
    render(
      <NavigationProvider route="/login">
        <CommunityPage path="/login" params={new URLSearchParams({ return: destination })} />
      </NavigationProvider>,
    )
    expect(screen.getByRole('link', { name: '← 返回' }).getAttribute('href')).toBe(destination)
  },
)
