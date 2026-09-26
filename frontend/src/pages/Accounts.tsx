import { useEffect, useRef, useState } from 'react'
import { useConfirm } from '../Confirm'
import { usePlatform } from '../platform'
import { formatDate, type ManagedAccount } from '../types'
import './accounts.css'

export function AccountsPage() {
  const platform = usePlatform()
  const confirm = useConfirm()
  const api = platform.accounts
  const apiRef = useRef(api)
  useEffect(() => {
    apiRef.current = api
  }, [api])
  const [page, setPage] = useState(0)
  const [revision, setRevision] = useState(0)
  const [result, setResult] = useState<{ accounts: ManagedAccount[]; has_more: boolean } | null>(
    null,
  )
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    if (!platform.remote || !platform.isOwner || !apiRef.current) return
    let live = true
    apiRef.current
      .list(page)
      .then((value) => {
        if (live) {
          setResult(value)
          setLoading(false)
        }
      })
      .catch((cause) => {
        if (live) {
          setError(cause instanceof Error ? cause.message : '账号列表读取失败，请重试。')
          setLoading(false)
        }
      })
    return () => {
      live = false
    }
  }, [page, revision, platform.remote, platform.isOwner])

  async function change(account: ManagedAccount, role: boolean, restricted: boolean) {
    if (!api || account.id === platform.state.visitor?.id) return
    const label =
      role !== (account.role === 'owner')
        ? role
          ? '授予站主权限'
          : '撤销站主权限'
        : restricted
          ? '限制本站写入'
          : '恢复本站写入'
    if (
      !(await confirm({
        title: label,
        description: `${account.email || account.nickname}：${role ? '站主能够查看私有草稿、发布内容、管理留言及其他账号。' : '访客只能管理自己的资料和留言。'}${restricted ? '限制后无法修改本站资料或留言；仍可登录和阅读。' : '此操作会立即更改该账号的本站权限。'}请确认账号无误。`,
        confirmLabel: label,
        danger: true,
      }))
    )
      return
    setPending(true)
    setError('')
    setNotice('')
    try {
      await api.setAccess(account.id, role, restricted)
      setResult(await api.list(page))
      setNotice('账号权限已更新。')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '操作失败，请刷新确认当前状态后重试。')
    } finally {
      setPending(false)
    }
  }
  if (!platform.remote)
    return (
      <section className="studio-content">
        <h1>账号与权限</h1>
        <p>本机预览不连接真实账号，无法管理云端用户。请在正式网站使用站主账号登录。</p>
      </section>
    )
  if (!platform.isOwner)
    return (
      <section className="studio-content">
        <h1>账号与权限</h1>
        <p>当前账号没有管理权限。</p>
      </section>
    )
  return (
    <section className="studio-content accounts-page">
      <div className="studio-page-title">
        <div>
          <p className="eyebrow">工作台 / 账号</p>
          <h1>账号与权限</h1>
          <p className="muted">站主可管理全站内容。限制本站写入不会禁止账号登录或公开阅读。</p>
        </div>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="form-notice" role="status">
          {notice}
        </p>
      )}
      <button
        className="button secondary"
        disabled={pending || loading}
        onClick={() => {
          setLoading(true)
          setError('')
          setRevision((value) => value + 1)
        }}
      >
        刷新账号
      </button>
      {loading ? (
        <p role="status">正在读取账号…</p>
      ) : (
        result && (
          <>
            <div className="accounts-list">
              {result.accounts.map((account) => {
                const self = account.id === platform.state.visitor?.id
                return (
                  <article className="account-card" key={account.id}>
                    <div>
                      <h2>
                        {account.nickname || '未设置昵称'}
                        {self ? '（我）' : ''}
                      </h2>
                      <p>{account.email || '未绑定邮箱'}</p>
                      <p className="muted">
                        {account.email_confirmed_at ? '邮箱已验证' : '邮箱未验证'} ·{' '}
                        {account.role === 'owner' ? '站主' : '访客'} ·{' '}
                        {account.restricted ? '本站写入受限' : '本站写入正常'}
                      </p>
                      <p className="muted">
                        注册于 {formatDate(account.created_at)} · 最近登录{' '}
                        {formatDate(account.last_sign_in_at || '') || '尚未登录'}
                      </p>
                      <details>
                        <summary>账号标识</summary>
                        <code>{account.id}</code>
                      </details>
                    </div>
                    <div className="account-actions">
                      {self ? (
                        <p className="muted">不能更改自己的站主权限或限制自己的账号。</p>
                      ) : (
                        <>
                          <button
                            className="button secondary"
                            disabled={
                              pending ||
                              loading ||
                              (!account.email_confirmed_at && account.role !== 'owner') ||
                              account.restricted
                            }
                            onClick={() =>
                              void change(account, account.role !== 'owner', account.restricted)
                            }
                          >
                            {account.role === 'owner' ? '撤销站主权限' : '授予站主权限'}
                          </button>
                          <button
                            className="button secondary"
                            disabled={pending || loading}
                            onClick={() =>
                              void change(
                                account,
                                account.restricted ? account.role === 'owner' : false,
                                !account.restricted,
                              )
                            }
                          >
                            {account.restricted ? '恢复本站写入' : '限制本站写入'}
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
            {!result.accounts.length && <p>暂无账号。</p>}
            <div className="accounts-pagination">
              <button
                className="button secondary"
                disabled={pending || loading || page === 0}
                onClick={() => {
                  setLoading(true)
                  setError('')
                  setResult(null)
                  setPage(page - 1)
                }}
              >
                上一页
              </button>
              <span>第 {page + 1} 页</span>
              <button
                className="button secondary"
                disabled={pending || loading || !result.has_more}
                onClick={() => {
                  setLoading(true)
                  setError('')
                  setResult(null)
                  setPage(page + 1)
                }}
              >
                下一页
              </button>
            </div>
          </>
        )
      )}
    </section>
  )
}
