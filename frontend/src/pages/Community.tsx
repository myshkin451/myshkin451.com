import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { go } from '../navigation'
import { usePlatform } from '../platform'
import { formatDate } from '../types'
import type { Message } from '../types'
import './community.css'

const MESSAGE_LIMIT = 1000
const memoryDrafts = new Map<string, { body: string; parentId: string | null }>()

function returnPath(value: string | null): string {
  if (!value || /[\\\s#]/.test(value)) return '/guestbook'
  const path = value.split('?')[0]
  return /^\/(?:|guestbook|account|archive|writing|photos|projects|about|play\/color|(?:entry|topics)\/[^/]+)$/.test(
    path,
  )
    ? value
    : '/guestbook'
}

function authLink(page: 'login' | 'register' | 'recover', destination: string) {
  return `/${page}?return=${encodeURIComponent(returnPath(destination))}`
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : '暂时没能保存，请重试。你的文字还在这里。'
}

function scrollToElement(element: HTMLElement | null) {
  element?.scrollIntoView({
    block: 'center',
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  })
}

function readDraft(targetId: string) {
  const cached = memoryDrafts.get(targetId)
  if (cached) return cached
  try {
    const stored = JSON.parse(sessionStorage.getItem(`myshkin-message:${targetId}`) || 'null')
    if (stored && typeof stored.body === 'string') {
      return {
        body: stored.body.slice(0, MESSAGE_LIMIT),
        parentId: typeof stored.parentId === 'string' ? stored.parentId : null,
      }
    }
  } catch {
    // The in-memory copy still preserves a draft when browser storage is unavailable.
  }
  return { body: '', parentId: null }
}

function keepDraft(targetId: string, draft: { body: string; parentId: string | null }) {
  memoryDrafts.set(targetId, draft)
  try {
    if (draft.body || draft.parentId) {
      sessionStorage.setItem(`myshkin-message:${targetId}`, JSON.stringify(draft))
    } else {
      sessionStorage.removeItem(`myshkin-message:${targetId}`)
    }
  } catch {
    // Drafts remain in memory for navigation within this preview.
  }
}

function useFormError() {
  const [error, setError] = useState('')
  const errorRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])
  return { error, setError, errorRef }
}

function MessageItem({
  message,
  parent,
  onReply,
  onDeleted,
  isReply,
}: {
  message: Message
  parent?: Message
  onReply: (message: Message) => void
  onDeleted: () => void
  isReply: boolean
}) {
  const platform = usePlatform()
  const own = message.authorId === platform.state.visitor?.id
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(message.body)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pending, setPending] = useState(false)
  const { error, setError, errorRef } = useFormError()
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const editButton = useRef<HTMLButtonElement>(null)
  const restoreEditFocus = useRef(false)
  const editId = useId()

  useEffect(() => {
    if (editing) editorRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (!editing && !pending && restoreEditFocus.current) {
      editButton.current?.focus()
      restoreEditFocus.current = false
    }
  }, [editing, pending])

  async function save(event: FormEvent) {
    event.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) {
      setError('请先写一点内容。')
      return
    }
    setPending(true)
    setError('')
    try {
      await platform.editMessage(message.id, trimmed)
      restoreEditFocus.current = true
      setEditing(false)
    } catch (failure) {
      setError(errorText(failure))
    } finally {
      setPending(false)
    }
  }

  async function remove() {
    setPending(true)
    setError('')
    try {
      await platform.deleteMessage(message.id)
      setConfirmDelete(false)
      setPending(false)
      onDeleted()
    } catch (failure) {
      setError(errorText(failure))
      setPending(false)
    }
  }

  return (
    <article
      className={`community-message${isReply ? ' community-message--reply' : ''}`}
      id={`message-${message.id}`}
      aria-label={`${message.authorName}的留言`}
      tabIndex={-1}
    >
      <div className="community-message-meta">
        <span className="community-avatar" aria-hidden="true">
          {message.authorName.slice(0, 1)}
        </span>
        <span className="community-author">{message.authorName}</span>
        {own && <span className="community-self">我</span>}
        <time dateTime={message.createdAt}>{formatDate(message.createdAt)}</time>
      </div>
      {parent && (
        <button
          type="button"
          className="community-reply-context"
          onClick={() => {
            const target = document.getElementById(`message-${parent.id}`)
            target?.focus({ preventScroll: true })
            scrollToElement(target)
          }}
        >
          回复 {parent.authorName}
        </button>
      )}
      {editing ? (
        <form className="community-edit" onSubmit={save}>
          <label htmlFor={editId} className="sr-only">
            修改留言
          </label>
          <textarea
            id={editId}
            ref={editorRef}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={MESSAGE_LIMIT}
            rows={4}
            disabled={pending}
            aria-describedby={`${editId}-count`}
          />
          <div className="community-form-bottom">
            <span className="community-counter" id={`${editId}-count`}>
              {body.length} / {MESSAGE_LIMIT}
            </span>
            <div className="community-actions">
              <button
                type="button"
                className="button quiet"
                disabled={pending}
                onClick={() => {
                  restoreEditFocus.current = true
                  setEditing(false)
                  setError('')
                }}
              >
                取消
              </button>
              <button type="submit" className="button" disabled={pending}>
                {pending ? '保存中…' : '保存修改'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <p className="community-message-body">{message.body}</p>
      )}
      {!editing && (
        <div className="community-message-actions">
          <button type="button" onClick={() => onReply(message)} disabled={pending}>
            回复
          </button>
          {own && (
            <>
              <button
                type="button"
                ref={editButton}
                disabled={pending}
                onClick={() => {
                  setBody(message.body)
                  setConfirmDelete(false)
                  setError('')
                  setEditing(true)
                }}
              >
                修改
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setConfirmDelete(true)
                  setError('')
                }}
              >
                删除
              </button>
            </>
          )}
        </div>
      )}
      {confirmDelete && (
        <div className="community-delete-confirm">
          <p>删除这条留言？</p>
          <div className="community-actions">
            <button
              type="button"
              className="button quiet"
              disabled={pending}
              onClick={() => setConfirmDelete(false)}
            >
              保留
            </button>
            <button type="button" className="button danger" disabled={pending} onClick={remove}>
              {pending ? '删除中…' : '确认删除'}
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className="form-error" role="alert" tabIndex={-1} ref={errorRef}>
          {error}
        </p>
      )}
    </article>
  )
}

function DiscussionThread({ targetId }: { targetId: string }) {
  const platform = usePlatform()
  const visitor = platform.state.visitor
  const [initial] = useState(() => readDraft(targetId))
  const [body, setBody] = useState(initial.body)
  const [parentId, setParentId] = useState<string | null>(initial.parentId)
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const { error, setError, errorRef } = useFormError()
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const fieldId = useId()
  const messages = platform.state.messages.filter(
    (message) => message.targetId === targetId && !message.hidden,
  )
  const byId = new Map(messages.map((message) => [message.id, message]))
  const replyingTo = parentId ? byId.get(parentId) : undefined
  const threads = new Map<string, Message[]>()
  for (const message of messages) {
    let root = message
    const visited = new Set<string>([message.id])
    while (root.parentId && byId.has(root.parentId) && !visited.has(root.parentId)) {
      visited.add(root.parentId)
      root = byId.get(root.parentId)!
    }
    const thread = threads.get(root.id) || []
    thread.push(message)
    threads.set(root.id, thread)
  }
  const orderedThreads = [...threads.entries()].sort((left, right) =>
    (byId.get(right[0])?.createdAt || '').localeCompare(byId.get(left[0])?.createdAt || ''),
  )

  useEffect(() => {
    keepDraft(targetId, { body, parentId })
  }, [body, parentId, targetId])

  useEffect(() => {
    if (notice && !pending) composerRef.current?.focus()
  }, [notice, pending])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!visitor) {
      keepDraft(targetId, { body, parentId })
      go(authLink('login', window.location.hash.slice(1)))
      return
    }
    const trimmed = body.trim()
    if (!trimmed) {
      setError('请先写一点内容。')
      return
    }
    setPending(true)
    setNotice('')
    setError('')
    try {
      await platform.addMessage(targetId, trimmed, replyingTo?.id)
      setBody('')
      setParentId(null)
      keepDraft(targetId, { body: '', parentId: null })
      setNotice('留言已保存在本机。')
    } catch (failure) {
      setError(errorText(failure))
    } finally {
      setPending(false)
    }
  }

  function reply(message: Message) {
    setParentId(message.id)
    setNotice('')
    composerRef.current?.focus()
    scrollToElement(composerRef.current)
  }

  return (
    <div className="community-discussion">
      <form className="community-composer" onSubmit={submit}>
        <div className="community-composer-heading">
          <label className="field-label" htmlFor={fieldId}>
            {replyingTo ? `回复 ${replyingTo.authorName}` : '写一条留言'}
          </label>
          {visitor && (
            <a href="#/account" className="community-composer-identity">
              {visitor.nickname}
            </a>
          )}
        </div>
        {replyingTo && (
          <div className="community-composer-context">
            <span>{replyingTo.body}</span>
            <button type="button" onClick={() => setParentId(null)} aria-label="取消回复">
              ×
            </button>
          </div>
        )}
        <textarea
          ref={composerRef}
          id={fieldId}
          rows={4}
          maxLength={MESSAGE_LIMIT}
          value={body}
          placeholder="想说些什么？"
          onChange={(event) => {
            setBody(event.target.value)
            setNotice('')
          }}
          disabled={pending}
          aria-describedby={`${fieldId}-hint ${fieldId}-count`}
        />
        <div className="community-form-bottom">
          <div className="community-compose-hints">
            <span id={`${fieldId}-hint`} className="community-compose-hint">
              {visitor ? '支持纯文字，最多 1000 字。' : '登录后发布，已写的文字会保留。'}
            </span>
            <span id={`${fieldId}-count`} className="community-counter">
              {body.length} / {MESSAGE_LIMIT}
            </span>
          </div>
          <button type="submit" className="button" disabled={pending || !platform.ready}>
            {pending ? '保存中…' : visitor ? '发布留言' : '登录后留言'}
          </button>
        </div>
        {error && (
          <p className="form-error" role="alert" ref={errorRef} tabIndex={-1}>
            {error}
          </p>
        )}
        {notice && (
          <p className="form-notice" role="status">
            {notice}
          </p>
        )}
      </form>
      {messages.length > 0 && (
        <div className="community-thread-heading">
          <h2>{targetId === 'guestbook' ? '已有留言' : '讨论'}</h2>
          <span>{messages.length} 条</span>
        </div>
      )}
      {messages.length ? (
        <div className="community-threads">
          {orderedThreads.map(([rootId, thread]) => (
            <div className="community-thread" key={rootId}>
              {thread
                .sort((left, right) =>
                  left.id === rootId
                    ? -1
                    : right.id === rootId
                      ? 1
                      : left.createdAt.localeCompare(right.createdAt),
                )
                .map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    parent={message.parentId ? byId.get(message.parentId) : undefined}
                    onReply={reply}
                    onDeleted={() => composerRef.current?.focus()}
                    isReply={message.id !== rootId}
                  />
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="community-empty">
          <span className="community-empty-line" aria-hidden="true" />
          <p>这里还没有留言。</p>
        </div>
      )}
    </div>
  )
}

export function Discussion({ targetId }: { targetId: string }) {
  return <DiscussionThread key={targetId} targetId={targetId} />
}

function Guestbook() {
  return (
    <div className="community-page guestbook-layout">
      <header className="community-intro">
        <h1 className="page-heading">留言</h1>
        <p className="community-local-note">
          当前为本机演示。留言和演示身份只保存在这个浏览器，不会公开发布。
        </p>
      </header>
      <Discussion targetId="guestbook" />
    </div>
  )
}

function AuthPanel({ path, params }: { path: string; params: URLSearchParams }) {
  const platform = usePlatform()
  const register = path === '/register'
  const recovery = path === '/recover'
  const destination = returnPath(params.get('return'))
  const [nickname, setNickname] = useState(platform.state.visitor?.nickname || '')
  const [pending, setPending] = useState(false)
  const [recoveryNotice, setRecoveryNotice] = useState(false)
  const { error, setError, errorRef } = useFormError()
  const fieldId = useId()
  const noticeRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    if (recoveryNotice) noticeRef.current?.focus()
  }, [recoveryNotice])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (recovery) {
      setRecoveryNotice(true)
      return
    }
    if (!nickname.trim()) {
      setError('请填写昵称。')
      return
    }
    setPending(true)
    setError('')
    try {
      await platform.signIn(nickname.trim())
      go(destination)
    } catch (failure) {
      setError(errorText(failure))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="community-auth-page">
      <section className="community-auth-panel" aria-labelledby="community-auth-title">
        <a className="community-back" href={`#${destination}`}>
          ← 返回
        </a>
        <header>
          <h1 id="community-auth-title">
            {recovery ? '账号找回' : register ? '创建留言身份' : '留言身份'}
          </h1>
          <p>{recovery ? '当前为本机演示，尚未提供账号找回。' : '这个昵称会显示在你的留言旁。'}</p>
        </header>
        <form onSubmit={submit} className="community-auth-form">
          {!recovery && (
            <div className="field">
              <label className="field-label" htmlFor={`${fieldId}-nickname`}>
                昵称
              </label>
              <input
                id={`${fieldId}-nickname`}
                name="nickname"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="怎么称呼你"
                autoComplete="off"
                maxLength={24}
                disabled={pending}
                aria-describedby={`${fieldId}-demo`}
              />
            </div>
          )}
          <p id={`${fieldId}-demo`} className="community-demo-note">
            {recovery
              ? '演示身份保存在当前浏览器。退出后再次进入会创建新身份。'
              : '本机演示：身份和留言只保存在当前浏览器，无需邮箱或密码。'}
          </p>
          {error && (
            <p className="form-error" role="alert" ref={errorRef} tabIndex={-1}>
              {error}
            </p>
          )}
          <button
            type="submit"
            className="button community-auth-submit"
            disabled={pending || !platform.ready}
          >
            {pending
              ? '保存中…'
              : recovery
                ? '查看说明'
                : register
                  ? '创建演示身份'
                  : '以演示身份继续'}
            <span aria-hidden="true">↗</span>
          </button>
          {recoveryNotice && (
            <p className="form-notice" role="status" tabIndex={-1} ref={noticeRef}>
              无法恢复已退出的演示身份。你可以返回登录，创建新的留言身份。
            </p>
          )}
        </form>
        <div className="community-auth-links">
          <a href={`#${authLink(register || recovery ? 'login' : 'register', destination)}`}>
            {register || recovery ? '返回登录' : '创建演示身份'}
          </a>
          {!register && !recovery && <a href={`#${authLink('recover', destination)}`}>找回账号</a>}
        </div>
      </section>
    </div>
  )
}

function Account() {
  const platform = usePlatform()
  const visitor = platform.state.visitor
  const [nickname, setNickname] = useState(visitor?.nickname || '')
  const [pending, setPending] = useState(false)
  const [notice, setNotice] = useState('')
  const { error, setError, errorRef } = useFormError()
  const fieldId = useId()
  const ownMessages = platform.state.messages
    .filter((message) => message.authorId === visitor?.id && !message.hidden)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!nickname.trim()) {
      setError('昵称不能为空。')
      return
    }
    setPending(true)
    setError('')
    setNotice('')
    try {
      await platform.signIn(nickname.trim())
      setNotice('昵称已更新。')
    } catch (failure) {
      setError(errorText(failure))
    } finally {
      setPending(false)
    }
  }

  async function signOut() {
    setPending(true)
    setError('')
    try {
      await platform.signOut()
      go('/guestbook')
    } catch (failure) {
      setError(errorText(failure))
      setPending(false)
    }
  }

  if (!visitor)
    return (
      <div className="community-auth-page">
        <section className="community-auth-panel community-signed-out">
          <span className="eyebrow">访客账号</span>
          <h1>我的账号</h1>
          <p>登录后，可以在这里查看自己的留言。</p>
          <a href={`#${authLink('login', '/account')}`} className="button">
            以演示身份登录 <span aria-hidden="true">↗</span>
          </a>
        </section>
      </div>
    )

  return (
    <div className="community-page community-account">
      <header className="community-account-heading">
        <span className="eyebrow">访客账号</span>
        <h1 className="page-heading">{visitor.nickname}</h1>
        <p className="community-local-note">
          这是当前浏览器的演示身份。清除浏览器数据后，本机记录会丢失。
        </p>
      </header>
      <div className="community-account-layout">
        <section className="community-profile" aria-labelledby="community-profile-title">
          <h2 id="community-profile-title">个人资料</h2>
          <form onSubmit={save}>
            <div className="field">
              <label className="field-label" htmlFor={fieldId}>
                昵称
              </label>
              <input
                id={fieldId}
                value={nickname}
                onChange={(event) => {
                  setNickname(event.target.value)
                  setNotice('')
                }}
                maxLength={24}
                disabled={pending}
              />
            </div>
            <button
              type="submit"
              className="button secondary"
              disabled={pending || nickname.trim() === visitor.nickname}
            >
              {pending ? '保存中…' : '保存昵称'}
            </button>
          </form>
          {error && (
            <p className="form-error" role="alert" tabIndex={-1} ref={errorRef}>
              {error}
            </p>
          )}
          {notice && (
            <p className="form-notice" role="status">
              {notice}
            </p>
          )}
          <div className="community-sign-out">
            <button type="button" className="button quiet" disabled={pending} onClick={signOut}>
              退出演示身份 <span aria-hidden="true">↗</span>
            </button>
            <p>退出后仍能浏览网站。再次进入会创建新的演示身份，旧留言仍保留。</p>
          </div>
        </section>
        <section aria-labelledby="community-my-messages">
          <div className="community-thread-heading">
            <h2 id="community-my-messages">我的留言</h2>
            <span>{ownMessages.length ? `${ownMessages.length} 条` : ''}</span>
          </div>
          {ownMessages.length ? (
            <div className="community-own-messages">
              {ownMessages.map((message) => {
                const entry = platform.entries.find(
                  (item) => item.id === message.targetId && item.status === 'published',
                )
                const destination =
                  message.targetId === 'guestbook'
                    ? '/guestbook'
                    : entry
                      ? `/entry/${encodeURIComponent(entry.id)}`
                      : ''
                return (
                  <article className="community-own-message" key={message.id}>
                    <div className="community-own-message-meta">
                      <span>
                        {message.targetId === 'guestbook' ? '留言板' : entry?.title || '内容已撤下'}
                      </span>
                      <time dateTime={message.createdAt}>{formatDate(message.createdAt)}</time>
                    </div>
                    <p>{message.body}</p>
                    {destination && (
                      <a href={`#${destination}`}>
                        查看讨论 <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="community-empty community-account-empty">
              <p>你还没有留下留言。</p>
              <a href="#/guestbook">
                去留言板看看 <span aria-hidden="true">↗</span>
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export function CommunityPage({ path, params }: { path: string; params: URLSearchParams }) {
  if (path === '/guestbook') return <Guestbook />
  if (path === '/account') return <Account />
  return <AuthPanel key={path} path={path} params={params} />
}
