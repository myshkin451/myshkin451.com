import { useId, useState } from 'react'
import { SiteLink, replaceRoute } from '../navigation'
import { usePlatform } from '../platform'
import { noteDate, noteExcerpt, publicNotes } from '../notes'
import { entryLabel, type Entry } from '../types'
import { Icon } from '../ui'
import { Discussion } from './Community'
import './notes.css'

export function NoteText({ body }: { body: string }) {
  // Plain text stays plain text. Only explicit web URLs become links; no remote embeds or HTML.
  return (
    <div className="note-text">
      {body.split(/(https?:\/\/[^\s<>"\u3000-\u303f\uff00-\uffef]+)/g).map((part, i) => {
        if (!/^https?:\/\//.test(part)) return part
        const link = part.replace(/[.,;:!?）)\]}]+$/, '')
        try {
          const url = new URL(link)
          if (!['http:', 'https:'].includes(url.protocol)) return part
          return (
            <span key={i}>
              <a href={url.href} target="_blank" rel="noopener noreferrer">
                {link}
              </a>
              {part.slice(link.length)}
            </span>
          )
        } catch {
          return part
        }
      })}
    </div>
  )
}

function NoteItem({
  entry,
  full = false,
  draft = false,
}: {
  entry: Entry
  full?: boolean
  draft?: boolean
}) {
  const { remote, isOwner } = usePlatform()
  const [expanded, setExpanded] = useState(full)
  const [copyState, setCopyState] = useState('')
  const bodyId = useId()
  const date = noteDate(entry.publishedAt || entry.createdAt)
  const isLong = [...entry.body].length > 480
  const href = '#/entry/' + entry.id + (draft ? '?draft=1' : '')
  async function copyLink() {
    try {
      const link = remote
        ? new URL('/entry/' + entry.id, window.location.origin).href
        : new URL(href, window.location.href).href
      await navigator.clipboard.writeText(link)
      setCopyState('链接已复制')
    } catch {
      setCopyState('请打开日期链接，再复制浏览器地址。')
    }
  }
  return (
    <article
      className={'note-item' + (full ? ' note-item-full' : '')}
      aria-label={date.month + '月' + date.day + '日的随记'}
    >
      <div className="note-date">
        <SiteLink
          href={href}
          aria-label={
            date.year + '年' + date.month + '月' + date.day + '日 ' + date.time + '，打开随记'
          }
        >
          <time
            dateTime={entry.publishedAt || entry.createdAt}
            title={date.year + '-' + date.month + '-' + date.day + ' ' + date.time + '（北京时间）'}
          >
            <span className="note-day">{date.day}</span>
            <span className="note-time">{date.time}</span>
          </time>
        </SiteLink>
      </div>
      <div className="note-content">
        {entry.sample && <span className="note-sample">排版样例</span>}
        <div id={bodyId}>
          <NoteText body={isLong && !expanded ? noteExcerpt(entry.body, 480) : entry.body} />
        </div>
        {isLong && !full && (
          <button
            className="note-expand"
            aria-expanded={expanded}
            aria-controls={bodyId}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '收起' : '展开全文'}
            <span aria-hidden="true">{expanded ? '−' : '+'}</span>
          </button>
        )}
        <div className="note-bottom">
          <div className="note-topics">
            {entry.topics.map((topic) => (
              <SiteLink key={topic} href={'#/notes?topic=' + encodeURIComponent(topic)}>
                <span aria-hidden="true">#</span>
                {topic}
              </SiteLink>
            ))}
          </div>
          <div className="note-actions">
            {!draft && entry.discussion && (
              <SiteLink href={href}>
                留言
                <Icon name="arrow" size={13} />
              </SiteLink>
            )}
            {(!remote || isOwner) && (
              <SiteLink href={'#/studio/notes?edit=' + entry.id}>编辑</SiteLink>
            )}
            {!draft && (
              <button type="button" onClick={() => void copyLink()} aria-label="复制这条随记的链接">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  aria-hidden="true"
                >
                  <path
                    d="m10 13 4-4m-5 7-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 10a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-2 2"
                    transform="translate(1 0) scale(.9)"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        {copyState && (
          <p className="note-feedback" role="status">
            {copyState}
          </p>
        )}
      </div>
    </article>
  )
}

export function Notes({ params }: { params: URLSearchParams }) {
  const { entries, remote, isOwner } = usePlatform()
  const notes = publicNotes(entries)
  const month = params.get('month') || ''
  const query = params.get('q') || ''
  const topic = params.get('topic') || ''
  const [limit, setLimit] = useState(20)
  const months = [...new Set(notes.map((entry) => noteDate(entry.publishedAt).key))]
  const filtered = notes.filter(
    (entry) =>
      (!month || noteDate(entry.publishedAt).key === month) &&
      (!topic || entry.topics.includes(topic)) &&
      (!query ||
        (entry.body + ' ' + entry.topics.join(' '))
          .toLocaleLowerCase()
          .includes(query.trim().toLocaleLowerCase())),
  )
  const shown = filtered.slice(0, limit)
  const groups = [...new Set(shown.map((entry) => noteDate(entry.publishedAt).key))]
  const change = (values: Record<string, string>) => {
    const next = new URLSearchParams(params)
    Object.entries(values).forEach(([key, value]) =>
      value ? next.set(key, value) : next.delete(key),
    )
    setLimit(20)
    replaceRoute('/notes' + (next.size ? '?' + next.toString() : ''))
  }
  return (
    <section className="notes-page">
      <header className="notes-heading">
        <div>
          <p className="notes-kicker">近况与想法</p>
          <h1>
            随记
            <span className="notes-period" aria-hidden="true">
              。
            </span>
          </h1>
        </div>
        {(!remote || isOwner) && (
          <SiteLink className="note-write-link" href="#/studio/notes">
            写一条
            <Icon name="plus" size={16} />
          </SiteLink>
        )}
      </header>
      <div className="notes-layout">
        <aside className="notes-aside">
          {notes.length > 0 && (
            <nav aria-label="随记月份" className="notes-calendar">
              <button aria-pressed={!month} onClick={() => change({ month: '' })}>
                全部随记<span>{notes.length}</span>
              </button>
              {months.map((key, i) => (
                <div key={key}>
                  {(!i || months[i - 1].slice(0, 4) !== key.slice(0, 4)) && (
                    <p className="notes-year">{key.slice(0, 4)}</p>
                  )}
                  <button aria-pressed={month === key} onClick={() => change({ month: key })}>
                    {Number(key.slice(5))} 月
                    <span>
                      {notes.filter((entry) => noteDate(entry.publishedAt).key === key).length}
                    </span>
                  </button>
                </div>
              ))}
            </nav>
          )}
          <SiteLink className="notes-longform" href="#/writing">
            长一点的文字
            <Icon name="arrow" size={15} />
          </SiteLink>
        </aside>
        <div className="notes-stream">
          {notes.length > 0 && (
            <div className="notes-tools">
              <span>
                {topic ? '#' + topic : '按时间倒序'}
                {(month || topic || query) && (
                  <button onClick={() => change({ month: '', q: '', topic: '' })}>清除筛选</button>
                )}
              </span>
              <label className="notes-search">
                <Icon name="search" size={15} />
                <input
                  type="search"
                  aria-label="搜索随记"
                  placeholder="搜索随记"
                  value={query}
                  onChange={(event) => change({ q: event.target.value })}
                />
              </label>
            </div>
          )}
          {groups.map((key) => (
            <section
              className="notes-month"
              key={key}
              aria-label={key.slice(0, 4) + '年' + Number(key.slice(5)) + '月'}
            >
              <h2>
                <span>{Number(key.slice(5))}月</span>
                <span>{key.slice(0, 4)}</span>
              </h2>
              {shown
                .filter((entry) => noteDate(entry.publishedAt).key === key)
                .map((entry) => (
                  <NoteItem key={entry.id} entry={entry} />
                ))}
            </section>
          ))}
          {!filtered.length && (
            <div className="notes-empty">
              <span className="notes-empty-stroke" aria-hidden="true" />
              <h2>{notes.length ? '没有找到这条随记' : '还没有公开的随记。'}</h2>
              {notes.length ? (
                <button
                  className="text-link"
                  onClick={() => change({ month: '', q: '', topic: '' })}
                >
                  清除筛选
                  <Icon name="arrow" size={15} />
                </button>
              ) : (
                (!remote || isOwner) && (
                  <SiteLink className="text-link" href="#/studio/notes">
                    写下第一条
                    <Icon name="arrow" size={15} />
                  </SiteLink>
                )
              )}
            </div>
          )}
          {filtered.length > shown.length && (
            <button className="notes-more" onClick={() => setLimit(limit + 20)}>
              更早的随记<span aria-hidden="true">↓</span>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

export function NoteDetail({ entry, draft }: { entry: Entry; draft: boolean }) {
  const date = noteDate(entry.publishedAt || entry.createdAt)
  return (
    <section className="note-detail">
      <div className="note-detail-head">
        <SiteLink className="back-link" href="#/notes">
          <Icon name="back" size={15} />
          全部随记
        </SiteLink>
        {draft && (
          <SiteLink className="draft-preview-badge" href={'#/studio/notes?edit=' + entry.id}>
            未发布 · 草稿预览
          </SiteLink>
        )}
      </div>
      <h1 className="sr-only">{entryLabel(entry)}</h1>
      <p className="note-detail-month">
        {date.year}
        <span>/</span>
        {date.month}
      </p>
      <NoteItem entry={entry} full draft={draft} />
      {!draft && entry.discussion && (
        <div className="note-discussion">
          <Discussion targetId={entry.id} />
        </div>
      )}
    </section>
  )
}
