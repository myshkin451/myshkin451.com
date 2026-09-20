import { SiteLink, currentRoute, replaceRoute, go } from '../navigation'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { usePlatform } from '../platform'
import { EntryArtwork, EntryCard, Icon, PhotoViewer, TextBody, primaryHref } from '../ui'
import { entryLabel, formatDate, kindLabels, safeDestination } from '../types'
import type { EntryKind } from '../types'
import { Discussion } from './Community'
import { Home } from './Home'
import { Notes, NoteDetail } from './Notes'

let lastCollection = '#/'
const collectionStorageKey = 'myshkin-last-collection'
const noCollectionSubscription = () => () => {}

function safeCollection(value: string | null): string {
  const path = value?.replace(/^#/, '') || '/'
  if (
    path.length > 4096 ||
    /[\\\s#]/.test(path) ||
    !/^\/(?:|archive|writing|photos|projects|topics\/[^/?]+)(?:\?[^#]*)?$/.test(path)
  )
    return '#/'
  return `#${path}`
}

function rememberCollection(value: string) {
  lastCollection = safeCollection(value)
  try {
    sessionStorage.setItem(collectionStorageKey, lastCollection)
  } catch {
    // In-page navigation still works when storage is disabled.
  }
}

function restoredCollection(): string {
  try {
    return safeCollection(sessionStorage.getItem(collectionStorageKey) || lastCollection)
  } catch {
    return safeCollection(lastCollection)
  }
}

type PageProps = { path: string; params: URLSearchParams }

function updateQuery(path: string, params: URLSearchParams, values: Record<string, string>) {
  const query = new URLSearchParams(params)
  Object.entries(values).forEach(([key, value]) =>
    value ? query.set(key, value) : query.delete(key),
  )
  replaceRoute(`${path}${query.size ? `?${query}` : ''}`)
}

function Collection({ path, params }: PageProps) {
  const { entries, state } = usePlatform()
  const routeKind: EntryKind | undefined =
    path === '/writing'
      ? 'writing'
      : path === '/photos'
        ? 'photo'
        : path === '/projects'
          ? 'project'
          : undefined
  let routeTopic = ''
  try {
    if (path.startsWith('/topics/')) routeTopic = decodeURIComponent(path.slice(8))
  } catch {
    /* Show the empty topic state for malformed URLs. */
  }
  const requestedKind = params.get('kind')
  const selectedKind =
    routeKind ||
    (['writing', 'photo', 'project', 'note'].includes(requestedKind || '')
      ? (requestedKind as EntryKind)
      : '')
  const topic = routeTopic || params.get('topic') || ''
  const query = params.get('q') || ''
  const view = params.get('view') || state.settings.homeView
  const published = entries.filter((entry) => entry.status === 'published')
  const topics = [...new Set(published.flatMap((entry) => entry.topics))]
  const filtered = useMemo(
    () =>
      published.filter(
        (entry) =>
          (!selectedKind || entry.kind === selectedKind) &&
          (!topic || entry.topics.includes(topic)) &&
          (!query ||
            `${entryLabel(entry)} ${entry.summary} ${entry.body} ${entry.topics.join(' ')}`
              .toLocaleLowerCase()
              .includes(query.trim().toLocaleLowerCase())),
      ),
    [published, selectedKind, topic, query],
  )
  const visible = filtered
  const selectedId = params.get('selected') || ''
  const selection = visible.find((entry) => entry.id === selectedId) || visible[0]
  const change = (values: Record<string, string>) =>
    updateQuery(path === '/' ? '/archive' : path, params, values)
  const title = routeTopic || (routeKind ? kindLabels[routeKind] : '全部内容')
  useEffect(() => {
    rememberCollection(currentRoute())
  }, [path, params])

  return (
    <section className="collection-page">
      <div className="collection-heading">
        <div>
          <SiteLink className="back-link" href="#/">
            <Icon name="back" size={15} />
            返回首页
          </SiteLink>
          <h1>{title}</h1>
          {routeTopic && <p className="page-lead">与「{routeTopic}」相关的内容</p>}
        </div>
      </div>
      {published.length > 0 && (
        <>
          <div className="collection-toolbar">
            {!routeKind ? (
              <nav className="type-filter" aria-label="按内容类型筛选">
                {[
                  ['', '全部'],
                  ['writing', '文章'],
                  ['note', '随记'],
                  ['photo', '影像'],
                  ['project', '项目'],
                ].map(([kind, label]) => (
                  <button
                    key={kind}
                    onClick={() => change({ kind })}
                    aria-pressed={selectedKind === kind}
                  >
                    {label}
                    <span>{published.filter((entry) => !kind || entry.kind === kind).length}</span>
                  </button>
                ))}
              </nav>
            ) : (
              <p className="collection-caption">
                {routeKind === 'photo'
                  ? '单张与组图'
                  : routeKind === 'writing'
                    ? '文章与笔记'
                    : '网站、工具与其他尝试'}
              </p>
            )}
            <div className="collection-controls">
              <label className="search-box">
                <Icon name="search" size={16} />
                <input
                  type="search"
                  aria-label="搜索内容"
                  placeholder="搜索"
                  value={query}
                  onChange={(event) => change({ q: event.target.value })}
                />
              </label>
              <div className="view-toggle" role="group" aria-label="浏览方式">
                <button
                  className="icon-button"
                  onClick={() => change({ view: 'grid' })}
                  aria-label="图文视图"
                  aria-pressed={view !== 'list'}
                >
                  <Icon name="grid" size={17} />
                </button>
                <button
                  className="icon-button"
                  onClick={() => change({ view: 'list' })}
                  aria-label="目录视图"
                  aria-pressed={view === 'list'}
                >
                  <Icon name="list" size={18} />
                </button>
              </div>
            </div>
          </div>
          {topics.length > 0 && !routeTopic && (
            <div className="topic-filter" aria-label="按话题筛选">
              <span>话题</span>
              <button aria-pressed={!topic} onClick={() => change({ topic: '' })}>
                全部
              </button>
              {topics.map((item) => (
                <button
                  key={item}
                  aria-pressed={topic === item}
                  onClick={() => change({ topic: item })}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      {visible.length ? (
        view === 'list' ? (
          <div className="content-index">
            <div className="index-rows">
              {visible.map((entry, index) => (
                <button
                  key={entry.id}
                  className={`index-row ${entry.id === selection.id ? 'selected' : ''}`}
                  onClick={() => change({ selected: entry.id })}
                  aria-pressed={entry.id === selection.id}
                >
                  <span className="index-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="index-row-name">
                    {entryLabel(entry)}
                    <small>
                      {entry.sample ? '样例 · ' : ''}
                      {entry.topics.join(' / ')}
                    </small>
                  </span>
                  <span className="index-kind">{kindLabels[entry.kind]}</span>
                  <Icon name="arrow" size={16} />
                </button>
              ))}
            </div>
            <article className="index-preview" key={selection.id}>
              {!['writing', 'note'].includes(selection.kind) || selection.cover ? (
                <EntryArtwork entry={selection} />
              ) : null}
              <div className="card-meta">
                <span>
                  {kindLabels[selection.kind]}
                  {selection.sample ? ' · 样例' : ''}
                </span>
                <span>{formatDate(selection.publishedAt)}</span>
              </div>
              <h2>{entryLabel(selection)}</h2>
              <p>{selection.kind === 'note' ? selection.body : selection.summary}</p>
              <SiteLink
                className="text-link"
                href={primaryHref(selection)}
                target={/^https?:/.test(primaryHref(selection)) ? '_blank' : undefined}
                rel="noreferrer"
              >
                {selection.kind === 'project' && selection.destination ? '打开项目' : '查看内容'}
                <Icon name="arrow" size={16} />
              </SiteLink>
              {selection.kind === 'project' && selection.destination && (
                <SiteLink className="index-detail-link" href={`#/entry/${selection.id}`}>
                  项目说明
                </SiteLink>
              )}
            </article>
          </div>
        ) : (
          <div className={`entry-grid ${routeKind === 'writing' ? 'writing-grid' : ''}`}>
            {visible.map((entry, index) => (
              <EntryCard key={entry.id} entry={entry} index={index} />
            ))}
          </div>
        )
      ) : (
        <div className="collection-empty">
          <h2>
            {published.length
              ? '没有找到相关内容'
              : routeKind
                ? `暂无${kindLabels[routeKind]}`
                : '暂无公开内容'}
          </h2>
          {published.length > 0 && <p>试试其他关键词，或重新选择分类。</p>}
          {published.length ? (
            <button
              className="button secondary"
              onClick={() => {
                if (routeTopic || routeKind) go('/archive')
                else change({ q: '', topic: '', kind: '' })
              }}
            >
              查看全部
            </button>
          ) : (
            <SiteLink className="text-link" href="#/">
              返回首页
              <Icon name="arrow" size={16} />
            </SiteLink>
          )}
        </div>
      )}
    </section>
  )
}

function EntryPage({ id, draft }: { id: string; draft: boolean }) {
  const { entries, drafts, remote } = usePlatform()
  // SSR always emits a safe deterministic link. Hydration restores this tab's
  // collection route, including its filters and selection, after a document load.
  const collection = useSyncExternalStore(noCollectionSubscription, restoredCollection, () => '#/')
  const entry = draft
    ? drafts.find((item) => item.id === id)
    : entries.find((item) => item.id === id && item.status === 'published')
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  const [largeType, setLargeType] = useState(false)
  const [photoLayout, setPhotoLayout] = useState<'story' | 'overview'>('story')
  if (!entry)
    return (
      <NotFound
        title={draft ? '没有找到这份草稿' : '内容暂时不可用'}
        text="这项内容可能还没有发布，或已被移除。"
      />
    )
  if (entry.kind === 'note') return <NoteDetail entry={entry} draft={draft} />
  const headings = entry.body
    .split(/\n\s*\n/)
    .filter((block) => block.startsWith('## '))
    .map((block) => block.slice(3))
  const related = entries
    .filter(
      (item) =>
        item.status === 'published' &&
        item.id !== id &&
        item.topics.some((topic) => entry.topics.includes(topic)),
    )
    .slice(0, 3)
  const destination = safeDestination(entry.destination)
  return (
    <article className={`entry-page entry-page-${entry.kind}`}>
      <div className="entry-back-row">
        <SiteLink className="back-link" href={collection}>
          <Icon name="back" size={16} />
          返回内容
        </SiteLink>
        {draft ? (
          <SiteLink className="draft-preview-badge" href={`#/studio/edit/${entry.id}`}>
            {remote ? '未发布 · 草稿预览' : '未发布 · 本机草稿预览'}
            <Icon name="arrow" size={14} />
          </SiteLink>
        ) : (
          <span className="entry-date">{formatDate(entry.publishedAt)}</span>
        )}
      </div>
      <header className="entry-heading">
        <div className="entry-labels">
          <span>
            {kindLabels[entry.kind]}
            {entry.sample ? ' · 样例' : ''}
          </span>
          {entry.topics.map((topic) => (
            <SiteLink key={topic} href={`#/topics/${encodeURIComponent(topic)}`}>
              {topic}
            </SiteLink>
          ))}
        </div>
        <h1>{entryLabel(entry)}</h1>
        {entry.summary && <p>{entry.summary}</p>}
        {entry.kind === 'project' && destination && (
          <SiteLink
            className="button"
            href={destination}
            target={/^https?:/.test(destination) ? '_blank' : undefined}
            rel="noreferrer"
          >
            {destination.startsWith('#/') ? '打开体验' : '访问项目'}
            <Icon name="external" size={17} />
          </SiteLink>
        )}
      </header>
      {entry.kind === 'writing' && (
        <div className="article-layout">
          <aside className="reading-aside">
            {headings.length > 0 && (
              <nav aria-label="文章目录">
                <span>本文目录</span>
                {headings.map((heading, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      document.getElementById(`section-${index}`)?.scrollIntoView({
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
              className={`reading-type ${largeType ? 'active' : ''}`}
              aria-pressed={largeType}
              onClick={() => setLargeType(!largeType)}
            >
              Aa<span>{largeType ? '标准字号' : '放大字号'}</span>
            </button>
          </aside>
          <div className={`article-copy ${largeType ? 'large-type' : ''}`}>
            {entry.cover && (
              <img className="article-cover" src={entry.cover} alt={entryLabel(entry)} />
            )}
            <TextBody text={entry.body} />
            <span className="article-end" aria-label="正文结束" />
          </div>
        </div>
      )}
      {entry.kind === 'photo' && (
        <>
          <div className="album-toolbar">
            <span>{entry.photos.length} 张图像</span>
            <div role="group" aria-label="影像排列">
              <button
                aria-pressed={photoLayout === 'story'}
                onClick={() => setPhotoLayout('story')}
              >
                展开
              </button>
              <button
                aria-pressed={photoLayout === 'overview'}
                onClick={() => setPhotoLayout('overview')}
              >
                总览
              </button>
            </div>
            <span className="album-hint">
              点击查看大图
              <Icon name="external" size={12} />
            </span>
          </div>
          <div className={`album-photos ${photoLayout}`}>
            {entry.photos.map((photo, index) => (
              <figure key={photo.id}>
                <button
                  onClick={() => setViewerIndex(index)}
                  aria-label={`查看大图：${photo.caption || photo.alt || `第 ${index + 1} 张`}`}
                >
                  <img src={photo.src} alt={photo.alt} loading={index === 0 ? 'eager' : 'lazy'} />
                </button>
                <figcaption>
                  <span>
                    {String(index + 1).padStart(2, '0')}
                    <span>{photo.caption}</span>
                  </span>
                  <small>{photo.credit}</small>
                </figcaption>
              </figure>
            ))}
          </div>
          {entry.body && (
            <div className="album-description">
              <TextBody text={entry.body} />
            </div>
          )}
          {viewerIndex !== null && (
            <PhotoViewer
              photos={entry.photos}
              index={viewerIndex}
              onIndex={setViewerIndex}
              onClose={() => setViewerIndex(null)}
            />
          )}
        </>
      )}
      {entry.kind === 'project' && (
        <div className="project-content">
          <div className="project-hero">
            <EntryArtwork entry={entry} />
          </div>
          <div className="project-description">
            <span className="eyebrow">项目说明</span>
            <TextBody text={entry.body || entry.summary} />
          </div>
        </div>
      )}
      {entry.kind !== 'photo' && entry.photos.length > 0 && (
        <div className="attached-photos album-photos overview">
          {entry.photos.map((photo, index) => (
            <figure key={photo.id}>
              <button
                onClick={() => setViewerIndex(index)}
                aria-label={`查看大图：${photo.caption || photo.alt || `第 ${index + 1} 张`}`}
              >
                <img src={photo.src} alt={photo.alt} loading="lazy" />
              </button>
              <figcaption>
                <span>{photo.caption}</span>
                <small>{photo.credit}</small>
              </figcaption>
            </figure>
          ))}
          {viewerIndex !== null && (
            <PhotoViewer
              photos={entry.photos}
              index={viewerIndex}
              onIndex={setViewerIndex}
              onClose={() => setViewerIndex(null)}
            />
          )}
        </div>
      )}
      {!draft && entry.discussion && (
        <div className="entry-discussion">
          <Discussion targetId={entry.id} />
        </div>
      )}
      {!draft && related.length > 0 && (
        <section className="related-content">
          <div className="section-row">
            <h2>相关内容</h2>
            <SiteLink className="text-link" href="#/archive">
              全部
              <Icon name="arrow" size={15} />
            </SiteLink>
          </div>
          <div className="entry-grid">
            {related.map((item) => (
              <EntryCard key={item.id} entry={item} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

function About() {
  const { state } = usePlatform()
  return (
    <section className="about-page">
      <SiteLink className="back-link" href="#/">
        <Icon name="back" size={15} />
        返回首页
      </SiteLink>
      <h1>关于</h1>
      <div className="about-content">
        {state.settings.about ? (
          <TextBody text={state.settings.about} />
        ) : (
          <p>这是 {state.settings.name} 的个人网站，用来发布文章、照片和项目。</p>
        )}
        {state.settings.intro && <p className="about-intro">{state.settings.intro}</p>}
        <div className="about-links">
          <SiteLink href="#/archive">
            全部内容
            <Icon name="arrow" size={16} />
          </SiteLink>
          <SiteLink href="#/guestbook">
            留言
            <Icon name="arrow" size={16} />
          </SiteLink>
        </div>
      </div>
    </section>
  )
}

export function NotFound({
  title = '没有找到这个页面',
  text = '可以回到首页继续浏览。',
}: {
  title?: string
  text?: string
}) {
  return (
    <section className="not-found">
      <span className="eyebrow">404</span>
      <h1 className="page-heading">{title}</h1>
      <p>{text}</p>
      <SiteLink className="button secondary" href="#/">
        返回首页
        <Icon name="arrow" />
      </SiteLink>
    </section>
  )
}

export function PublicPage({ path, params }: PageProps) {
  if (path === '/notes') return <Notes params={params} />
  if (path === '/' && !params.size)
    return (
      <Home
        onVisit={() => {
          rememberCollection('/')
        }}
      />
    )
  if (
    ['/', '/archive', '/writing', '/photos', '/projects'].includes(path) ||
    path.startsWith('/topics/')
  )
    return <Collection key={path} path={path} params={params} />
  if (path === '/about') return <About />
  if (path.startsWith('/entry/')) {
    let id = ''
    try {
      id = decodeURIComponent(path.slice(7))
    } catch {
      return <NotFound />
    }
    return (
      <EntryPage key={`${id}:${params.get('draft')}`} id={id} draft={params.get('draft') === '1'} />
    )
  }
  return <NotFound />
}
