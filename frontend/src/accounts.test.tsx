// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AccountsPage } from './pages/Accounts'
import { initialState } from './model'
import { defaultSettings } from './seed'
import type { ManagedAccount, Platform } from './types'
const fixture = vi.hoisted(() => ({ platform: {} as Platform, confirm: vi.fn() }))
vi.mock('./platform', () => ({ usePlatform: () => fixture.platform }))
vi.mock('./Confirm', () => ({ useConfirm: () => fixture.confirm }))
const person = (id: string, role: 'owner' | 'visitor'): ManagedAccount => ({
  id,
  role,
  nickname: id,
  email: `${id}@example.test`,
  email_confirmed_at: '2026-09-01',
  restricted: false,
  created_at: '2026-09-01',
  last_sign_in_at: null,
})
beforeEach(() => {
  vi.clearAllMocks()
  fixture.confirm.mockResolvedValue(true)
  fixture.platform = {
    remote: true,
    isOwner: true,
    state: { ...initialState(defaultSettings), visitor: { id: 'owner', nickname: 'owner' } },
    accounts: {
      list: vi.fn().mockResolvedValue({
        accounts: [person('owner', 'owner'), person('visitor', 'visitor')],
        has_more: true,
      }),
      setAccess: vi.fn().mockResolvedValue(undefined),
    },
  } as unknown as Platform
})
afterEach(cleanup)
it('protects the current owner and paginates the server list', async () => {
  render(<AccountsPage />)
  await screen.findByText('owner（我）')
  expect(screen.getAllByRole('button', { name: '授予站主权限' })).toHaveLength(1)
  expect(screen.queryByRole('button', { name: '撤销站主权限' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: '下一页' }))
  await waitFor(() => expect(fixture.platform.accounts!.list).toHaveBeenCalledWith(1))
})
it('keeps the account list and reports a rejected permission change', async () => {
  vi.mocked(fixture.platform.accounts!.setAccess).mockRejectedValue(new Error('服务端拒绝更改'))
  render(<AccountsPage />)
  fireEvent.click(await screen.findByRole('button', { name: '授予站主权限' }))
  await screen.findByText('服务端拒绝更改')
  expect(screen.getByText('visitor@example.test')).toBeTruthy()
  expect(fixture.platform.accounts!.setAccess).toHaveBeenCalledWith('visitor', true, false)
  expect(screen.queryByText('账号权限已更新。')).toBeNull()
})
it('does not read real accounts in local preview', () => {
  fixture.platform.remote = false
  render(<AccountsPage />)
  expect(screen.getByText(/本机预览不连接真实账号/)).toBeTruthy()
  expect(fixture.platform.accounts!.list).not.toHaveBeenCalled()
})
it('does not apply a canceled access decision', async () => {
  fixture.confirm.mockResolvedValue(false)
  render(<AccountsPage />)
  fireEvent.click(await screen.findByRole('button', { name: '限制本站写入' }))
  await waitFor(() => expect(fixture.confirm).toHaveBeenCalled())
  expect(fixture.platform.accounts!.setAccess).not.toHaveBeenCalled()
})
