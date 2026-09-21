// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CommunityPage } from './pages/Community'
import { NavigationProvider, useRoute } from './navigation'
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
  window.history.replaceState(null, '', '#/studio/notes')
  fixture.platform = {
    remote: true,
    isOwner: false,
    entries: [],
    drafts: [],
    state: initialState(defaultSettings),
    saveDraft: vi.fn().mockImplementation(async (entry: Entry) => {
      fixture.platform.drafts = [
        { ...entry, status: 'draft', updatedAt: now },
        ...fixture.platform.drafts.filter((item) => item.id !== entry.id),
      ]
    }),
    publishEntry: vi.fn().mockImplementation(async (entry: Entry) => {
      fixture.platform.entries = [
        { ...entry, status: 'published', publishedAt: now },
        ...fixture.platform.entries.filter((item) => item.id !== entry.id),
      ]
      fixture.platform.drafts = fixture.platform.drafts.filter((item) => item.id !== entry.id)
    }),
  } as unknown as Platform
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  delete document.body.dataset.routing
  window.history.replaceState(null, '', '/')
})

function RoutedEditor() {
  const { params } = useRoute()
  return (
    <ConfirmProvider>
      <NoteWorkspace params={params} />
    </ConfirmProvider>
  )
}

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
  const setup = () => render(<RoutedEditor />)
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
    expect(screen.getByText('草稿已保存')).toBeTruthy()
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

describe('automatic private draft saving', () => {
  const pause = async (milliseconds = 1300) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(milliseconds)
    })
  }
  const write = (body: string) => {
    const field = screen.getByRole('textbox', { name: '随记正文' }) as HTMLTextAreaElement
    fireEvent.change(field, { target: { value: body } })
    return field
  }
  it.each(['hash', 'path'])(
    'waits for Chinese composition and preserves focus with %s routing',
    async (routing) => {
      vi.useFakeTimers()
      if (routing === 'path') {
        document.body.dataset.routing = 'path'
        window.history.replaceState(null, '', '/studio/notes')
      }
      render(<RoutedEditor />)
      const field = screen.getByRole('textbox', { name: '随记正文' }) as HTMLTextAreaElement
      field.focus()
      fireEvent.compositionStart(field)
      write('zheng zai')
      await pause(3000)
      expect(fixture.platform.saveDraft).not.toHaveBeenCalled()
      fireEvent.compositionEnd(field)
      write('正在写下的想法')
      await pause()
      expect(fixture.platform.saveDraft).toHaveBeenCalledTimes(1)
      expect(fixture.platform.publishEntry).not.toHaveBeenCalled()
      const destination = '/studio/notes?edit=' + fixture.platform.drafts[0].id
      expect(
        routing === 'path'
          ? window.location.pathname + window.location.search
          : window.location.hash.slice(1),
      ).toBe(destination)
      expect(document.activeElement).toBe(field)
      expect(screen.getByRole('textbox', { name: '随记正文' })).toBe(field)
      expect(screen.getByText('草稿已保存')).toBeTruthy()
      expect(screen.getByRole('button', { name: '草稿1' }).getAttribute('aria-pressed')).toBe(
        'true',
      )
    },
  )
  it('starts a separate blank note after following the new-note link from an automatic draft', async () => {
    vi.useFakeTimers()
    render(<RoutedEditor />)
    const field = screen.getByRole('textbox', { name: '随记正文' })
    fireEvent.change(field, { target: { value: '保留在原草稿' } })
    await act(() => vi.advanceTimersByTimeAsync(1200))
    const originalId = fixture.platform.drafts[0].id
    await act(async () => {
      window.history.replaceState(null, '', '#/studio/notes')
      window.dispatchEvent(new Event('popstate'))
    })
    const next = screen.getByRole('textbox', { name: '随记正文' }) as HTMLTextAreaElement
    expect(next.value).toBe('')
    expect(next).not.toBe(field)
    fireEvent.change(next, { target: { value: '另一条想法' } })
    await act(() => vi.advanceTimersByTimeAsync(1200))
    expect(fixture.platform.drafts).toHaveLength(2)
    expect(fixture.platform.drafts.find((entry) => entry.id === originalId)?.body).toBe(
      '保留在原草稿',
    )
    expect(window.location.hash).not.toContain(originalId)
  })
  it('retains text typed during a slow save and publishes only the latest text on demand', async () => {
    vi.useFakeTimers()
    const commit = vi.mocked(fixture.platform.saveDraft).getMockImplementation()!
    let complete!: () => Promise<void>
    vi.mocked(fixture.platform.saveDraft).mockImplementationOnce(
      (entry) =>
        new Promise<void>((resolve) => {
          complete = async () => {
            await commit(entry)
            resolve()
          }
        }),
    )
    render(<RoutedEditor />)
    const field = write('第一句话')
    await pause()
    expect(field.disabled).toBe(false)
    write('第一句话，还有刚刚补上的内容')
    fireEvent.keyDown(field, { key: 'Enter', ctrlKey: true })
    expect(fixture.platform.publishEntry).not.toHaveBeenCalled()
    await act(async () => {
      await complete()
    })
    expect(field.value).toBe('第一句话，还有刚刚补上的内容')
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '发布' }))
    })
    expect(fixture.platform.publishEntry).toHaveBeenCalledWith(
      expect.objectContaining({ body: '第一句话，还有刚刚补上的内容' }),
    )
    await pause(4000)
    expect(fixture.platform.saveDraft).toHaveBeenCalledTimes(1)
    expect(fixture.platform.drafts).toHaveLength(0)
    expect((screen.getByRole('textbox', { name: '随记正文' }) as HTMLTextAreaElement).value).toBe(
      '',
    )
    expect(window.location.hash).toBe('#/studio/notes')
  })
  it('keeps the public version unchanged until an explicit publication', async () => {
    vi.useFakeTimers()
    const entry = { ...makeNote('原来的公开文字'), status: 'published' as const, publishedAt: now }
    fixture.platform.entries = [entry]
    window.history.replaceState(null, '', '#/studio/notes?edit=' + entry.id)
    render(<RoutedEditor />)
    write('新想法，还不公开')
    await pause()
    expect(fixture.platform.entries[0].body).toBe('原来的公开文字')
    expect(fixture.platform.drafts[0].body).toBe('新想法，还不公开')
    expect(screen.getByText('修改未发布')).toBeTruthy()
    expect(fixture.platform.publishEntry).not.toHaveBeenCalled()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '发布修改' }))
    })
    expect(fixture.platform.entries[0].body).toBe('新想法，还不公开')
  })
  it('shows a failed save, retains text, and retries after the owner edits again', async () => {
    vi.useFakeTimers()
    vi.mocked(fixture.platform.saveDraft).mockRejectedValueOnce(new Error('网络暂时不可用'))
    render(<RoutedEditor />)
    const field = write('不要丢掉这句话')
    await pause()
    expect(screen.getByRole('alert').textContent).toContain('网络暂时不可用')
    expect(field.value).toBe('不要丢掉这句话')
    await pause(10000)
    expect(fixture.platform.saveDraft).toHaveBeenCalledTimes(1)
    write('不要丢掉这句话。继续写。')
    await pause()
    expect(fixture.platform.saveDraft).toHaveBeenCalledTimes(2)
    expect(fixture.platform.drafts[0].body).toBe('不要丢掉这句话。继续写。')
    expect(screen.queryByRole('alert')).toBeNull()
  })
  it('does not navigate back to the editor when an abandoned save eventually completes', async () => {
    vi.useFakeTimers()
    let complete!: () => void
    vi.mocked(fixture.platform.saveDraft).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          complete = resolve
        }),
    )
    const view = render(<RoutedEditor />)
    write('正在保存')
    await pause()
    view.unmount()
    window.history.replaceState(null, '', '#/notes')
    await act(async () => {
      complete()
    })
    expect(window.location.hash).toBe('#/notes')
  })
})
