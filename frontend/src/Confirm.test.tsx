// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEffect } from 'react'
import { ConfirmProvider, useConfirm } from './Confirm'
import { useRoute } from './navigation'
import { StudioPage } from './pages/Studio'
import type { Platform } from './types'

const { platform } = vi.hoisted(() => ({
  platform: {
    ready: true,
    error: '',
    entries: [],
    drafts: [],
    state: {
      version: 1,
      mode: 'empty',
      entries: [],
      drafts: [],
      messages: [],
      deletedIds: [],
      visitor: null,
      settings: { name: 'Myshkin', intro: '', about: '', homeView: 'grid' },
    },
    saveDraft: vi.fn().mockResolvedValue(undefined),
    publishEntry: vi.fn().mockResolvedValue(undefined),
    unpublishEntry: vi.fn().mockResolvedValue(undefined),
    deleteEntry: vi.fn().mockResolvedValue(undefined),
    updateSettings: vi.fn().mockResolvedValue(undefined),
  } as unknown as Platform,
}))

vi.mock('./platform', () => ({ usePlatform: () => platform }))

beforeAll(() => {
  // JSDOM does not implement modal dialogs; only their browser lifecycle is shimmed.
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
})

beforeEach(() => {
  window.history.replaceState(null, '', '#/studio/new?kind=writing')
  vi.clearAllMocks()
  vi.spyOn(window, 'confirm').mockImplementation(() => {
    throw new Error('Native confirm must not be called')
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function StudioHarness() {
  const { path, params } = useRoute()
  return (
    <ConfirmProvider>
      <a
        href="#main"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        跳到内容
      </a>
      <main id="main" tabIndex={-1}>
        {path.startsWith('/studio') ? (
          <StudioPage path={path} params={params} />
        ) : (
          <p data-testid="destination">{path}</p>
        )}
      </main>
    </ConfirmProvider>
  )
}

function editTitle() {
  const title = screen.getByLabelText('标题') as HTMLInputElement
  fireEvent.change(title, { target: { value: '尚未保存的文章' } })
  return title
}

describe('Studio navigation with unsaved content', () => {
  it('cancels a link navigation synchronously and preserves the editor, URL and focus', async () => {
    render(<StudioHarness />)
    const title = editTitle()
    const link = screen.getByRole('link', { name: '查看网站' })
    link.focus()
    expect(fireEvent.click(link)).toBe(false)
    expect(window.location.hash).toBe('#/studio/new?kind=writing')
    const cancel = await screen.findByRole('button', { name: '继续编辑' })
    expect(document.activeElement).toBe(cancel)
    fireEvent.click(cancel)
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(window.location.hash).toBe('#/studio/new?kind=writing')
    expect(title.value).toBe('尚未保存的文章')
    expect(document.activeElement).toBe(link)
  })

  it('retries an accepted link exactly once, without another confirmation', async () => {
    render(<StudioHarness />)
    editTitle()
    const received = vi.fn()
    window.addEventListener('hashchange', received)
    try {
      fireEvent.click(screen.getByRole('link', { name: '查看网站' }))
      fireEvent.click(await screen.findByRole('button', { name: '放弃修改并离开' }))
      await waitFor(() => expect(screen.getByTestId('destination').textContent).toBe('/'))
      expect(window.location.hash).toBe('#/')
      expect(received).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).toBeNull()
    } finally {
      window.removeEventListener('hashchange', received)
    }
  })

  it('restores the URL before asking about hash navigation and keeps it when cancelled', async () => {
    render(<StudioHarness />)
    const title = editTitle()
    act(() => {
      window.location.hash = '/archive'
    })
    const dialog = await screen.findByRole('dialog')
    expect(window.location.hash).toBe('#/studio/new?kind=writing')
    expect(screen.queryByTestId('destination')).toBeNull()
    fireEvent(dialog, new Event('cancel', { cancelable: true }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(title.value).toBe('尚未保存的文章')
    expect(window.location.hash).toBe('#/studio/new?kind=writing')
  })

  it('resumes an accepted hash navigation once after restoring the prior URL', async () => {
    render(<StudioHarness />)
    editTitle()
    const received = vi.fn()
    window.addEventListener('hashchange', received)
    try {
      act(() => {
        window.location.hash = '/archive'
      })
      const accept = await screen.findByRole('button', { name: '放弃修改并离开' })
      expect(received).not.toHaveBeenCalled()
      fireEvent.click(accept)
      await waitFor(() => expect(screen.getByTestId('destination').textContent).toBe('/archive'))
      expect(window.location.hash).toBe('#/archive')
      expect(received).toHaveBeenCalledTimes(1)
      expect(screen.queryByRole('dialog')).toBeNull()
    } finally {
      window.removeEventListener('hashchange', received)
    }
  })

  it('allows a same-page skip link and retains the tab-close guard while dirty', () => {
    render(<StudioHarness />)
    editTitle()
    fireEvent.click(screen.getByRole('link', { name: '跳到内容' }))
    expect(document.activeElement).toBe(document.getElementById('main'))
    expect(screen.queryByRole('dialog')).toBeNull()
    const close = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(close)
    expect(close.defaultPrevented).toBe(true)
  })
})

describe('confirmation promise lifecycle', () => {
  function Probe({ ready }: { ready: (confirm: ReturnType<typeof useConfirm>) => void }) {
    const confirm = useConfirm()
    useEffect(() => ready(confirm), [confirm, ready])
    return <button type="button">原来的按钮</button>
  }

  it('stays pending until a choice, rejects concurrent requests, and resolves once', async () => {
    let confirm!: ReturnType<typeof useConfirm>
    const options = {
      title: '删除内容？',
      description: '此操作无法撤销。',
      confirmLabel: '删除内容',
    }
    render(
      <ConfirmProvider>
        <Probe
          ready={(value) => {
            confirm = value
          }}
        />
      </ConfirmProvider>,
    )
    const trigger = screen.getByRole('button', { name: '原来的按钮' })
    trigger.focus()
    let result!: Promise<boolean>
    const resolved = vi.fn()
    act(() => {
      result = confirm(options)
      void result.then(resolved)
    })
    expect(resolved).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(screen.getByRole('button', { name: '取消' }))
    await expect(confirm({ ...options, title: '另一个请求' })).resolves.toBe(false)
    expect(screen.getByRole('heading', { name: '删除内容？' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '删除内容' }))
    await expect(result).resolves.toBe(true)
    expect(resolved).toHaveBeenCalledExactlyOnceWith(true)
    expect(document.activeElement).toBe(trigger)
  })

  it('settles an unfinished promise as cancelled when its provider unmounts', async () => {
    let confirm!: ReturnType<typeof useConfirm>
    const view = render(
      <ConfirmProvider>
        <Probe
          ready={(value) => {
            confirm = value
          }}
        />
      </ConfirmProvider>,
    )
    let result!: Promise<boolean>
    act(() => {
      result = confirm({ title: '继续？', description: '等待决定。', confirmLabel: '继续' })
    })
    view.unmount()
    await expect(result).resolves.toBe(false)
  })

  it('does not apply a previous dialog close event to a new open request', async () => {
    let confirm!: ReturnType<typeof useConfirm>
    render(
      <ConfirmProvider>
        <Probe
          ready={(value) => {
            confirm = value
          }}
        />
      </ConfirmProvider>,
    )
    let result!: Promise<boolean>
    const resolved = vi.fn()
    act(() => {
      result = confirm({ title: '新的决定', description: '仍在等待选择。', confirmLabel: '确定' })
      void result.then(resolved)
    })
    fireEvent(screen.getByRole('dialog'), new Event('close'))
    await act(async () => {
      await Promise.resolve()
    })
    expect(resolved).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: '取消' }))
    await expect(result).resolves.toBe(false)
  })
})
