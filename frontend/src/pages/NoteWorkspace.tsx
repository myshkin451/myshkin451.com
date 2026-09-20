import { useState, useRef, type FormEvent } from 'react'
import { usePlatform } from '../platform'
import { useConfirm } from '../Confirm'
import { useUnsavedWork } from '../useUnsavedWork'
import { SiteLink } from '../navigation'
import { entryLabel, newEntry, noteLimit, type Entry } from '../types'
import { noteDate, noteExcerpt } from '../notes'
import { Icon } from '../ui'
import './notes.css'
import './note-workspace.css'

const signature = (entry: Entry) => JSON.stringify([entry.body, entry.topics, entry.discussion])

function NoteComposer({ source }: { source?: Entry }) {
  const platform = usePlatform()
  const confirm = useConfirm()
  const [entry, setEntry] = useState(() => source || newEntry('note'))
  const [saved, setSaved] = useState(() => signature(source || newEntry('note')))
  const [topics, setTopics] = useState(source?.topics.join('，') || '')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [publishedLink, setPublishedLink] = useState('')
  const textarea = useRef<HTMLTextAreaElement>(null)
  const draft = {
    ...entry,
    topics: [
      ...new Set(
        topics
          .split(/[,，]/)
          .map((topic) => topic.trim())
          .filter(Boolean),
      ),
    ],
  }
  const dirty = signature(draft) !== saved
  useUnsavedWork(dirty || busy)
  const count = [...entry.body].length
  const published = platform.entries.some(
    (item) => item.id === entry.id && item.status === 'published',
  )

  const privateRevision = platform.drafts.some((item) => item.id === entry.id)
  const publicationStillVisible = platform.entries.some(
    (item) => '#/entry/' + item.id === publishedLink && item.status === 'published',
  )

  async function submit(publish: boolean, event?: FormEvent) {
    event?.preventDefault()
    if (busyRef.current) return
    setError('')
    setNotice('')
    if (count > noteLimit) {
      setError('随记请控制在 5000 个字符以内。')
      return
    }
    if (publish && !entry.body.trim()) {
      setError('先写一点内容吧。')
      textarea.current?.focus()
      return
    }
    if (draft.topics.length > 20 || draft.topics.some((topic) => [...topic].length > 40)) {
      setError('最多添加 20 个主题，每个不超过 40 个字符。')
      return
    }
    busyRef.current = true
    setBusy(true)
    try {
      if (publish) await platform.publishEntry(draft)
      else await platform.saveDraft(draft)
      setSaved(signature(draft))
      setNotice(publish ? (published ? '修改已发布。' : '已发布。') : '草稿已保存，仅你可见。')
      setPublishedLink(publish ? '#/entry/' + draft.id : '')
      if (publish && !source) {
        const next = newEntry('note')
        setEntry(next)
        setTopics('')
        setSaved(signature(next))
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '没有保存成功，文字仍在这里。请重试。')
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }
  async function clear() {
    if (busyRef.current) return
    if (
      dirty &&
      !(await confirm({
        title: '重新写一条？',
        description: '当前未保存的修改将被放弃。',
        confirmLabel: '放弃修改',
        cancelLabel: '继续编辑',
      }))
    )
      return
    const next = newEntry('note')
    setEntry(next)
    setSaved(signature(next))
    setTopics('')
    setError('')
    setNotice('')
    setPublishedLink('')
    textarea.current?.focus()
  }
  return (
    <form
      className="note-composer"
      onSubmit={(event) => void submit(true, event)}
      aria-label="随记编辑器"
    >
      <div className="note-composer-top">
        <span>{published ? '修改随记' : source ? '继续写' : '写一条'}</span>
        <span className="note-private-state">
          {dirty
            ? '未保存'
            : published && privateRevision
              ? '修改未发布'
              : published
                ? '已公开'
                : '仅你可见'}
        </span>
      </div>
      <textarea
        ref={textarea}
        aria-label="随记正文"
        placeholder="此刻想说的…"
        value={entry.body}
        disabled={busy}
        rows={6}
        onChange={(event) => {
          setEntry({ ...entry, body: event.target.value })
          setNotice('')
          setPublishedLink('')
        }}
        onKeyDown={(event) => {
          if (
            (event.metaKey || event.ctrlKey) &&
            event.key === 'Enter' &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault()
            void submit(true)
          }
        }}
      />
      <details className="note-options">
        <summary>主题与留言</summary>
        <div>
          <label className="field">
            <span>主题</span>
            <input
              value={topics}
              disabled={busy}
              onChange={(event) => setTopics(event.target.value)}
              placeholder="可不填，多个主题用逗号分开"
            />
          </label>
          <label className="note-discussion-toggle">
            <input
              type="checkbox"
              checked={entry.discussion}
              disabled={busy}
              onChange={(event) => setEntry({ ...entry, discussion: event.target.checked })}
            />
            允许访客留言
          </label>
        </div>
      </details>
      <div className="note-composer-foot">
        <span className={count > noteLimit ? 'form-error' : 'note-count'} aria-live="off">
          {count > 0 ? count.toLocaleString() + ' / 5,000' : '公开发布后，访客可读'}
        </span>
        <div>
          <button
            type="button"
            disabled={busy || !entry.body.trim()}
            onClick={() => void submit(false)}
          >
            存草稿
          </button>
          <button
            className="button"
            type="submit"
            disabled={busy || !entry.body.trim() || count > noteLimit}
          >
            {busy ? '正在保存…' : published ? '发布修改' : '发布'}
            <Icon name="arrow" size={15} />
          </button>
        </div>
      </div>
      {published && <p className="note-editor-hint">存草稿不会改变访客正在看到的版本。</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {notice && (!publishedLink || publicationStillVisible) && (
        <p className="note-save-notice" role="status">
          {notice}
          {publishedLink && (
            <SiteLink href={publishedLink}>
              查看
              <Icon name="external" size={13} />
            </SiteLink>
          )}
        </p>
      )}
      {!source && (entry.body || notice) && (
        <button
          className="note-start-new"
          type="button"
          disabled={busy}
          onClick={() => void clear()}
        >
          另写一条
        </button>
      )}
    </form>
  )
}

export function NoteWorkspace({ params }: { params: URLSearchParams }) {
  const platform = usePlatform()
  const confirm = useConfirm()
  const [view, setView] = useState<'published' | 'draft'>('published')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const editId = params.get('edit') || ''
  const source =
    platform.drafts.find((entry) => entry.id === editId && entry.kind === 'note') ||
    platform.entries.find((entry) => entry.id === editId && entry.kind === 'note')
  const published = platform.entries
    .filter((entry) => entry.kind === 'note' && entry.status === 'published')
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  const drafts = platform.drafts
    .filter((entry) => entry.kind === 'note')
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const list = view === 'published' ? published : drafts
  async function withdraw(entry: Entry) {
    if (
      busy ||
      !(await confirm({
        title: '撤下这条随记？',
        description: '访客将无法再读到它。内容会保留在草稿中，可以再次发布。',
        confirmLabel: '撤下并保留草稿',
      }))
    )
      return
    setBusy(entry.id)
    setError('')
    setNotice('')
    try {
      await platform.unpublishEntry(entry.id)
      setNotice('已撤下，内容保留在草稿中。')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '撤下失败，请重试。')
    } finally {
      setBusy('')
    }
  }
  return (
    <div className="note-workspace">
      <div className="note-workspace-heading">
        <div>
          <p>工作台</p>
          <h1>随记</h1>
        </div>
        <SiteLink className="text-link" href="#/notes">
          查看随记
          <Icon name="external" size={14} />
        </SiteLink>
      </div>
      <div className="note-workspace-layout">
        <section className="note-writing-area">
          {editId && (
            <SiteLink className="note-new-link" href="#/studio/notes">
              <Icon name="plus" size={14} />
              写新随记
            </SiteLink>
          )}
          {editId && !source ? (
            <p role="alert">这条随记已经不存在。</p>
          ) : (
            <NoteComposer key={editId || 'new'} source={source} />
          )}
          <p className="note-keyboard-hint">⌘ / Ctrl + Enter 发布</p>
        </section>
        <aside className="note-workspace-index" aria-label="管理随记">
          <div className="note-workspace-tabs">
            {(
              [
                ['published', '已发布', published.length],
                ['draft', '草稿', drafts.length],
              ] as const
            ).map(([value, label, count]) => (
              <button key={value} aria-pressed={view === value} onClick={() => setView(value)}>
                {label}
                <span>{count}</span>
              </button>
            ))}
          </div>
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          {notice && (
            <p role="status" className="note-save-notice">
              {notice}
            </p>
          )}
          {!list.length && (
            <p className="note-workspace-empty">
              {view === 'draft' ? '还没有草稿。' : '还没有发布随记。'}
            </p>
          )}
          {list.map((entry) => {
            const date = noteDate(view === 'published' ? entry.publishedAt : entry.updatedAt)
            return (
              <article
                className={'note-manage-item' + (editId === entry.id ? ' is-editing' : '')}
                key={entry.id}
              >
                <SiteLink
                  href={'#/studio/notes?edit=' + entry.id}
                  aria-label={'编辑：' + entryLabel(entry)}
                >
                  <time dateTime={entry.updatedAt}>
                    {date.month}.{date.day}
                    <span>{date.time}</span>
                  </time>
                  <p>{noteExcerpt(entry.body || '未写完的随记', 110)}</p>
                </SiteLink>
                <div>
                  {view === 'published' ? (
                    <>
                      {drafts.some((draft) => draft.id === entry.id) && <span>有未发布修改</span>}
                      <button disabled={Boolean(busy)} onClick={() => void withdraw(entry)}>
                        {busy === entry.id ? '正在撤下…' : '撤下'}
                      </button>
                    </>
                  ) : (
                    <SiteLink href={'#/entry/' + entry.id + '?draft=1'}>
                      预览草稿
                      <Icon name="arrow" size={12} />
                    </SiteLink>
                  )}
                </div>
              </article>
            )
          })}
        </aside>
      </div>
    </div>
  )
}
