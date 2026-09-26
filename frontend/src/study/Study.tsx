import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { entryLabel, kindLabels, type Entry, type EntryKind } from '../types'
import { CropPlayground } from './CropPlayground'
import { PhotoSequence } from './PhotoSequence'
import { entryPath, shortDate, studyEntries } from './data'
import { HomePresentation } from '../modern/HomePresentation'
import { defaultSettings } from '../seed'

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Link({
  to,
  children,
  className,
  label,
}: {
  to: string
  children: ReactNode
  className?: string
  label?: string
}) {
  return (
    <a href={`#${to}`} className={className} aria-label={label}>
      {children}
    </a>
  )
}

function subscribe(listener: () => void) {
  window.addEventListener('hashchange', listener)
  return () => window.removeEventListener('hashchange', listener)
}

function getRoute() {
  return window.location.hash.slice(1) || '/'
}

function Meta({ entry, date = true }: { entry: Entry; date?: boolean }) {
  return (
    <div className="study-meta">
      <span>{kindLabels[entry.kind]}</span>
      {entry.topics.length > 0 && <span>{entry.topics[0]}</span>}
      {date && <time dateTime={entry.publishedAt}>{shortDate(entry.publishedAt)}</time>}
    </div>
  )
}

function SectionHeading({
  title,
  to,
  link = '查看全部',
}: {
  title: string
  to: string
  link?: string
}) {
  return (
    <div className="study-section-heading">
      <h2>{title}</h2>
      <Link to={to} className="study-text-link">
        {link}
        <Arrow />
      </Link>
    </div>
  )
}

const filters: { value: EntryKind | ''; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'writing', label: '文章' },
  { value: 'photo', label: '影像' },
  { value: 'project', label: '项目' },
  { value: 'note', label: '随记' },
]

function Archive({ entries, route }: { entries: Entry[]; route: string }) {
  const params = new URLSearchParams(route.split('?')[1] || '')
  const kind = params.get('kind') || ''
  const query = params.get('q') || ''
  const topic = params.get('topic') || ''
  const topics = [...new Set(entries.flatMap((entry) => entry.topics))]
  const found = entries.filter(
    (entry) =>
      (!kind || entry.kind === kind) &&
      (!topic || entry.topics.includes(topic)) &&
      (!query ||
        `${entryLabel(entry)} ${entry.body} ${entry.topics.join(' ')}`
          .toLowerCase()
          .includes(query.toLowerCase())),
  )
  function change(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    const route = `/archive${next.size ? `?${next}` : ''}`
    window.history.replaceState(null, '', `#${route}`)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }
  return (
    <div className="study-archive">
      <header className="study-page-heading">
        <h1>全部内容</h1>
        <p>文章、影像、项目与随记。</p>
      </header>
      <div className="study-archive-controls">
        <div className="study-filter" role="group" aria-label="内容形式">
          {filters.map((filter) => (
            <button
              key={filter.value}
              aria-pressed={kind === filter.value}
              onClick={() => change('kind', filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <label className="study-search-field">
          <SearchIcon />
          <span className="study-sr-only">搜索内容</span>
          <input
            type="search"
            placeholder="搜索内容"
            value={query}
            onChange={(event) => change('q', event.target.value)}
          />
        </label>
      </div>
      {topics.length > 0 && (
        <div className="study-topic-filter">
          <label htmlFor="study-topic">话题</label>
          <select
            id="study-topic"
            value={topic}
            onChange={(event) => change('topic', event.target.value)}
          >
            <option value="">全部话题</option>
            {topics.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
          <span aria-live="polite">{found.length} 项内容</span>
        </div>
      )}
      {found.length ? (
        <div className="study-index">
          {found.map((entry) => (
            <Link
              key={entry.id}
              to={entryPath(entry)}
              className={`study-index-row study-index-${entry.kind}`}
            >
              <span className="study-index-kind">{kindLabels[entry.kind]}</span>
              <div className="study-index-title">
                <h2>{entryLabel(entry)}</h2>
                {entry.summary && <p>{entry.summary}</p>}
              </div>
              {entry.kind === 'photo' && (
                <img
                  src={entry.cover}
                  width="1254"
                  height="1254"
                  alt={entry.photos[0]?.alt || ''}
                  loading="lazy"
                />
              )}
              <time dateTime={entry.publishedAt}>{shortDate(entry.publishedAt)}</time>
              <Arrow />
            </Link>
          ))}
        </div>
      ) : (
        <div className="study-empty-result">
          <h2>{entries.length ? '没有找到相应内容。' : '这里还没有公开内容。'}</h2>
          {entries.length > 0 && (
            <button
              className="study-button"
              onClick={() => {
                window.location.hash = '/archive'
              }}
            >
              清除筛选
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function TextBody({ body }: { body: string }) {
  let heading = 0
  return (
    <>
      {body.split(/\n\n+/).map((paragraph, index) => {
        if (paragraph.startsWith('## '))
          return (
            <h2 key={index} id={`chapter-${heading++}`}>
              {paragraph.slice(3)}
            </h2>
          )
        if (paragraph.startsWith('> '))
          return <blockquote key={index}>{paragraph.slice(2)}</blockquote>
        return (
          <p key={index}>
            {paragraph.split(/(https?:\/\/[^\s]+)/g).map((piece, part) =>
              /^https?:\/\//.test(piece) ? (
                <a href={piece} key={part} target="_blank" rel="noreferrer">
                  {piece}
                </a>
              ) : (
                piece
              ),
            )}
          </p>
        )
      })}
    </>
  )
}

function Detail({ entry, entries, backTo }: { entry: Entry; entries: Entry[]; backTo: string }) {
  const [large, setLarge] = useState(false)
  const headings = entry.body
    .split(/\n\n+/)
    .filter((paragraph) => paragraph.startsWith('## '))
    .map((paragraph) => paragraph.slice(3))
  const related = entries.filter((item) => item.id !== entry.id && item.kind !== 'note').slice(0, 2)
  return (
    <article className={`study-detail study-detail-${entry.kind}`}>
      <Link to={backTo} className="study-back">
        ← 返回浏览
      </Link>
      <header className="study-detail-heading">
        <Meta entry={entry} />
        <h1>{entry.kind === 'note' ? '随记' : entry.title}</h1>
        {entry.summary && <p>{entry.summary}</p>}
        <span className="study-sample-label">
          {entry.kind === 'photo' ? 'AI 生成样图' : '设计样例'}
        </span>
      </header>
      {entry.id === 'crop' ? (
        <>
          <div className="study-project-stage">
            <CropPlayground />
          </div>
          <div className="study-project-description">
            <h2>使用方法</h2>
            <TextBody body={entry.body} />
          </div>
        </>
      ) : entry.kind === 'photo' ? (
        <PhotoSequence title={entry.title} photos={entry.photos} />
      ) : (
        <div className="study-reading-layout">
          <aside className="study-reading-aside">
            {headings.length > 0 && (
              <nav aria-label="文章目录">
                <span>本文内容</span>
                {headings.map((heading, index) => (
                  <button
                    key={heading}
                    onClick={() =>
                      document.getElementById(`chapter-${index}`)?.scrollIntoView({
                        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                          ? 'instant'
                          : 'smooth',
                        block: 'start',
                      })
                    }
                  >
                    {heading}
                  </button>
                ))}
              </nav>
            )}
            <button
              className="study-type-button"
              aria-pressed={large}
              onClick={() => setLarge(!large)}
            >
              <span aria-hidden="true">Aa</span>
              {large ? '标准字号' : '放大字号'}
            </button>
          </aside>
          <div className={`study-prose ${large ? 'study-prose-large' : ''}`}>
            <TextBody body={entry.body} />
            <div className="study-reading-end" aria-label="正文结束" />
          </div>
        </div>
      )}
      <section className="study-detail-next">
        <SectionHeading title="继续浏览" to="/archive" />
        <div className="study-related">
          {related.map((item) => (
            <Link key={item.id} to={entryPath(item)}>
              <Meta entry={item} date={false} />
              <h3>
                {item.title}
                <Arrow />
              </h3>
            </Link>
          ))}
        </div>
      </section>
    </article>
  )
}

function Notes({ entries, route }: { entries: Entry[]; route: string }) {
  const query = new URLSearchParams(route.split('?')[1] || '').get('q') || ''
  function changeQuery(value: string) {
    const params = new URLSearchParams()
    if (value) params.set('q', value)
    window.history.replaceState(null, '', `#/notes${params.size ? `?${params}` : ''}`)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }
  const notes = entries.filter(
    (entry) =>
      entry.kind === 'note' &&
      (!query || entry.body.includes(query) || entry.topics.some((topic) => topic.includes(query))),
  )
  return (
    <div className="study-notes">
      <header className="study-page-heading">
        <h1>随记</h1>
        <label className="study-search-field">
          <SearchIcon />
          <span className="study-sr-only">搜索随记</span>
          <input
            type="search"
            placeholder="搜索随记"
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
          />
        </label>
      </header>
      {notes.length ? (
        <div className="study-notes-list">
          {notes.map((entry) => (
            <article key={entry.id}>
              <Link to={entryPath(entry)} className="study-note-date">
                <time dateTime={entry.publishedAt}>{shortDate(entry.publishedAt)}</time>
                <span>{new Date(entry.publishedAt).getFullYear()}</span>
              </Link>
              <div>
                <TextBody body={entry.body} />
                <div className="study-note-bottom">
                  <span>{entry.topics.join(' · ')}</span>
                  <Link to={entryPath(entry)} label="打开这条随记">
                    <Arrow diagonal />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="study-empty-result">
          <h2>{query ? '没有找到相应随记。' : '还没有公开的随记。'}</h2>
        </div>
      )}
    </div>
  )
}

function About() {
  return (
    <div className="study-about">
      <header className="study-page-heading">
        <h1>Myshkin 451</h1>
        <p>一个放文字、图像和项目的地方。</p>
      </header>
      <div className="study-about-content">
        <p>这里的内容会随着创作慢慢增加。</p>
        <p>目前还没有公开的个人介绍。</p>
        <a href="./index.html#/guestbook" className="study-text-link">
          留言
          <Arrow />
        </a>
      </div>
      <div className="study-about-links">
        <a href="https://github.com/myshkin451/myshkin451.com" target="_blank" rel="noreferrer">
          网站源代码
          <Arrow diagonal />
        </a>
        <Link to="/archive">
          浏览全部内容
          <Arrow />
        </Link>
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function Search({
  entries,
  dialog,
}: {
  entries: Entry[]
  dialog: React.RefObject<HTMLDialogElement | null>
}) {
  const [query, setQuery] = useState('')
  const found = entries
    .filter(
      (entry) =>
        !query || `${entryLabel(entry)} ${entry.body}`.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 7)
  return (
    <dialog
      className="study-search-dialog"
      ref={dialog}
      aria-label="搜索网站"
      onClick={(event) => {
        if (event.target === event.currentTarget) dialog.current?.close()
      }}
    >
      <div className="study-search-dialog-top">
        <label>
          <SearchIcon />
          <span className="study-sr-only">查找文章、影像或项目</span>
          <input
            type="search"
            placeholder="查找文章、影像或项目"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <button onClick={() => dialog.current?.close()} aria-label="关闭搜索">
          关闭
        </button>
      </div>
      <div className="study-search-results">
        <p aria-live="polite">{query ? `${found.length} 项匹配内容` : '浏览内容'}</p>
        {found.map((entry) => (
          <a key={entry.id} href={`#${entryPath(entry)}`} onClick={() => dialog.current?.close()}>
            <span>{kindLabels[entry.kind]}</span>
            <strong>{entryLabel(entry)}</strong>
            <Arrow />
          </a>
        ))}
        {!found.length && (
          <div className="study-search-empty">
            {entries.length ? '试试其他关键词。' : '还没有公开的内容。'}
          </div>
        )}
      </div>
    </dialog>
  )
}

export function Study() {
  const route = useSyncExternalStore(subscribe, getRoute, () => '/')
  const path = route.split('?')[0]
  const [sample, setSample] = useState(
    () => new URLSearchParams(window.location.search).get('content') !== 'empty',
  )
  const [menu, setMenu] = useState(false)
  const [review, setReview] = useState(false)
  const search = useRef<HTMLDialogElement>(null)
  const main = useRef<HTMLElement>(null)
  const positions = useRef(new Map<string, number>())
  const [browseRoute, setBrowseRoute] = useState('/')
  const previous = useRef(route)
  const entries = useMemo(() => (sample ? studyEntries : []), [sample])
  let id = ''
  try {
    id = decodeURIComponent(path.slice('/entry/'.length))
  } catch {
    /* Show not found. */
  }
  const entry = path.startsWith('/entry/') ? entries.find((item) => item.id === id) : undefined

  useEffect(() => {
    const isNewPage = previous.current.split('?')[0] !== path
    if (isNewPage) {
      window.scrollTo({ top: positions.current.get(route) || 0, behavior: 'instant' })
      main.current?.focus({ preventScroll: true })
    }
    previous.current = route
    const record = () => positions.current.set(route, window.scrollY)
    window.addEventListener('scroll', record, { passive: true })
    return () => window.removeEventListener('scroll', record)
  }, [route, path])

  useEffect(() => {
    document.title = `${entry ? entryLabel(entry) : path === '/notes' ? '随记' : path === '/archive' ? '全部内容' : 'Myshkin 451'} · 设计研究`
  }, [entry, path])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        if (!search.current?.open) search.current?.showModal()
      }
      if (event.key === 'Escape') setMenu(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function changeContent(next: boolean) {
    setSample(next)
    const url = new URL(window.location.href)
    url.searchParams.set('content', next ? 'sample' : 'empty')
    if (path.startsWith('/entry/')) url.hash = '/'
    window.history.replaceState(null, '', url)
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  }

  return (
    <div
      className="study-app"
      onClickCapture={(event) => {
        if (!(event.target instanceof Element) || path.startsWith('/entry/')) return
        const anchor = event.target.closest('a')
        if (anchor?.getAttribute('href')?.startsWith('#/entry/')) setBrowseRoute(route)
      }}
    >
      <a
        href="#study-main"
        className="study-skip"
        onClick={(event) => {
          event.preventDefault()
          main.current?.focus()
        }}
      >
        跳到主要内容
      </a>
      <header className="study-header">
        <Link to="/" className="study-wordmark">
          Myshkin <span>451</span>
        </Link>
        <nav
          className={`study-nav ${menu ? 'is-open' : ''}`}
          aria-label="网站导航"
          onClick={() => setMenu(false)}
        >
          <a
            href="#/"
            aria-current={
              path === '/' || path === '/archive' || (entry && entry.kind !== 'note')
                ? 'page'
                : undefined
            }
          >
            作品
          </a>
          <a
            href="#/notes"
            aria-current={path === '/notes' || entry?.kind === 'note' ? 'page' : undefined}
          >
            随记
          </a>
          <a href="#/about" aria-current={path === '/about' ? 'page' : undefined}>
            关于
          </a>
        </nav>
        <div className="study-header-actions">
          <button
            className="study-search-trigger"
            onClick={() => search.current?.showModal()}
            aria-label="搜索网站"
          >
            <SearchIcon />
            <span>搜索</span>
            <kbd>⌘ K</kbd>
          </button>
          <button
            className="study-menu-trigger"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? '关闭' : '菜单'}
          </button>
        </div>
      </header>
      <main className="study-main" id="study-main" ref={main} tabIndex={-1}>
        {path === '/' ? (
          <HomePresentation entries={entries} settings={defaultSettings} />
        ) : path === '/archive' ? (
          <Archive entries={entries} route={route} />
        ) : path === '/notes' ? (
          <Notes entries={entries} route={route} />
        ) : path === '/about' ? (
          <About />
        ) : entry ? (
          <Detail key={entry.id} entry={entry} entries={entries} backTo={browseRoute} />
        ) : (
          <div className="study-empty-result">
            <h1>没有找到这项内容。</h1>
            <Link to="/" className="study-text-link">
              返回首页
              <Arrow />
            </Link>
          </div>
        )}
      </main>
      <footer className="study-footer">
        <Link to="/" className="study-wordmark">
          Myshkin <span>451</span>
        </Link>
        <nav aria-label="页脚导航">
          <Link to="/archive">全部内容</Link>
          <a href="./index.html#/guestbook">留言</a>
          <a href="./index.html#/studio">管理</a>
        </nav>
        <span>© {new Date().getFullYear()}</span>
      </footer>
      <aside className={`study-review ${review ? 'is-open' : ''}`} aria-label="设计预览控制">
        {review && (
          <div className="study-review-panel">
            <strong>独立设计样稿</strong>
            <p>
              这是早期设计探索。新版已接入完整平台，可在下方查看。当前内容均为排版样例，图片为 AI
              生成。
            </p>
            <div role="group" aria-label="预览内容">
              <button aria-pressed={sample} onClick={() => changeContent(true)}>
                样例内容
              </button>
              <button aria-pressed={!sample} onClick={() => changeContent(false)}>
                空内容
              </button>
            </div>
            <a href="./index.html?preview=sample">
              查看打磨后的新版
              <Arrow />
            </a>
          </div>
        )}
        <button
          className="study-review-toggle"
          aria-expanded={review}
          onClick={() => setReview(!review)}
        >
          <span className="study-review-indicator" />
          {sample ? '设计预览 · 样例' : '设计预览 · 空内容'}
          <span>{review ? '−' : '+'}</span>
        </button>
      </aside>
      <Search entries={entries} dialog={search} />
    </div>
  )
}
