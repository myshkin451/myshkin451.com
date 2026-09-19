import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useConfirm } from '../Confirm'
import { go } from '../navigation'
import { usePlatform } from '../platform'
import {
  formatDate,
  kindLabels,
  newEntry,
  safeDestination,
  type Entry,
  type EntryKind,
  type Photo,
  type Settings,
} from '../types'
import './studio.css'

const kinds: EntryKind[] = ['writing', 'photo', 'project']
const maxPhotos = 20
const maxImageBytes = 10 * 1024 * 1024

function errorText(error: unknown) {
  return error instanceof Error ? error.message : '没有保存成功，请重试。当前修改仍保留在编辑器里。'
}

function useUnsavedWork(dirty: boolean) {
  const confirm = useConfirm()
  const allowNext = useRef(false)
  const allowUnload = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    if (!dirty) return
    const previousUrl = window.location.href
    let deciding = false
    const confirmLeave = async (resume: () => void) => {
      if (deciding) return
      deciding = true
      const accepted = await confirm({
        title: '离开编辑器？',
        description: '还有未保存的修改。离开后，这些修改不会保留。',
        confirmLabel: '放弃修改并离开',
        cancelLabel: '继续编辑',
        danger: true,
      })
      deciding = false
      if (mounted.current && accepted) resume()
    }
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (allowUnload.current) {
        allowUnload.current = false
        return
      }
      event.preventDefault()
      event.returnValue = ''
    }
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]')
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const target = new URL(anchor.href, window.location.href)
      if (target.href === window.location.href) return
      const current = new URL(window.location.href)
      const sameDocument =
        target.origin === current.origin &&
        target.pathname === current.pathname &&
        target.search === current.search
      if (sameDocument && target.hash && !target.hash.startsWith('#/')) return
      // Stop both the browser default and any React router handler before awaiting a decision.
      event.preventDefault()
      event.stopImmediatePropagation()
      void confirmLeave(() => {
        if (sameDocument) {
          allowNext.current = true
          window.location.hash = target.hash
        } else {
          allowUnload.current = true
          window.location.assign(target.href)
          // Non-document protocols may not unload the page; do not leave its close guard disabled.
          window.setTimeout(() => {
            allowUnload.current = false
          }, 0)
        }
      })
    }
    const onHashChange = (event: HashChangeEvent) => {
      if (allowNext.current) {
        allowNext.current = false
        return
      }
      const target = new URL(event.newURL)
      window.history.replaceState(null, '', previousUrl)
      event.stopImmediatePropagation()
      void confirmLeave(() => {
        allowNext.current = true
        window.location.hash = target.hash
      })
    }
    document.addEventListener('click', onClick, true)
    window.addEventListener('hashchange', onHashChange, true)
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('hashchange', onHashChange, true)
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [confirm, dirty])
  return () => {
    allowNext.current = true
  }
}

function Arrow({ direction = 'right' }: { direction?: 'right' | 'left' }) {
  return (
    <svg
      className={`studio-arrow ${direction === 'left' ? 'studio-arrow-left' : ''}`}
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  )
}

function StudioHeader({ path }: { path: string }) {
  const { state } = usePlatform()
  return (
    <header className="studio-header">
      <a className="studio-brand" href="#/studio">
        <img className="studio-brand-mark" src="./assets/mark.svg" alt="" width="25" height="25" />
        <span>
          {state.settings.name}
          <small>工作台</small>
        </span>
      </a>
      <nav aria-label="工作台导航" className="studio-nav">
        <a
          href="#/studio"
          aria-current={
            !path.startsWith('/studio/settings') && !path.startsWith('/studio/comments')
              ? 'page'
              : undefined
          }
        >
          内容
        </a>
        <a href="#/studio/comments" aria-current={path === '/studio/comments' ? 'page' : undefined}>
          留言
        </a>
        <a href="#/studio/settings" aria-current={path === '/studio/settings' ? 'page' : undefined}>
          设置
        </a>
      </nav>
      <a className="studio-visit" href="#/">
        查看网站 <Arrow />
      </a>
    </header>
  )
}

function LocalNote() {
  return (
    <p className="studio-local-note">
      <span className="studio-local-dot" aria-hidden="true" />
      本机工作台
      <span className="studio-local-explanation">
        内容保存在当前浏览器；发布后可在本机网站查看。联网发布将在后续接入。
      </span>
    </p>
  )
}

function ContentList() {
  const platform = usePlatform()
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all')
  const [kind, setKind] = useState<'all' | EntryKind>('all')
  const [search, setSearch] = useState('')
  const entries = [...platform.entries]
  for (const draft of platform.drafts) {
    const index = entries.findIndex((entry) => entry.id === draft.id)
    if (index < 0) entries.push(draft)
    else entries[index] = draft
  }
  const isPublished = (id: string) =>
    platform.entries.some((entry) => entry.id === id && entry.status === 'published')
  const hasDraft = (id: string) => platform.drafts.some((entry) => entry.id === id)
  const visible = entries
    .filter(
      (entry) =>
        (kind === 'all' || entry.kind === kind) &&
        (status === 'all' ||
          (status === 'published'
            ? isPublished(entry.id)
            : hasDraft(entry.id) || !isPublished(entry.id))) &&
        `${entry.title} ${entry.summary} ${entry.topics.join(' ')}`
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return (
    <div className="studio-content">
      <div className="studio-page-title">
        <div>
          <p className="eyebrow">工作台 / 内容</p>
          <h1>内容</h1>
          <p className="muted">管理已发布内容和草稿。</p>
        </div>
      </div>
      <div className="studio-create-row">
        <a href="#/studio/new?kind=writing" className="studio-create-card">
          <span className="studio-create-symbol" aria-hidden="true">
            Aa
          </span>
          <span>
            <strong>写文章</strong>
            <small>文字、小记或长篇</small>
          </span>
          <Arrow />
        </a>
        <a href="#/studio/new?kind=photo" className="studio-create-card">
          <svg className="studio-create-symbol" viewBox="0 0 32 32" aria-hidden="true">
            <rect x="4" y="5" width="24" height="22" rx="1" />
            <path d="m5 24 8-9 6 6 4-4 5 5" />
            <circle cx="22" cy="11" r="2" />
          </svg>
          <span>
            <strong>发影像</strong>
            <small>一张照片，或一组</small>
          </span>
          <Arrow />
        </a>
        <a href="#/studio/new?kind=project" className="studio-create-card">
          <svg className="studio-create-symbol" viewBox="0 0 32 32" aria-hidden="true">
            <rect x="4" y="6" width="24" height="21" rx="1" />
            <path d="M4 12h24m-16 5-3 3 3 3m8-6 3 3-3 3" />
          </svg>
          <span>
            <strong>添加项目</strong>
            <small>作品、网站或小工具</small>
          </span>
          <Arrow />
        </a>
      </div>
      <div className="studio-library-head">
        <h2>
          所有内容 <span>{entries.length}</span>
        </h2>
        <label className="studio-search">
          <span className="sr-only">搜索内容</span>
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5" />
            <path d="m13 13 4 4" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索标题或主题"
          />
        </label>
      </div>
      <div className="studio-library-filters">
        <div className="studio-tabs" aria-label="发布状态">
          {(
            [
              ['all', '全部'],
              ['published', '已发布'],
              ['draft', '草稿与修改'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={status === value}
              onClick={() => setStatus(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="studio-kind-select">
          <span className="sr-only">内容形式</span>
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as 'all' | EntryKind)}
          >
            <option value="all">全部形式</option>
            {kinds.map((item) => (
              <option value={item} key={item}>
                {kindLabels[item]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {visible.length ? (
        <div className="studio-entry-list">
          {visible.map((entry) => {
            const published = isPublished(entry.id)
            const draft = hasDraft(entry.id)
            return (
              <article className="studio-entry-row" key={entry.id}>
                <a className="studio-entry-main" href={`#/studio/edit/${entry.id}`}>
                  <span className={`studio-entry-thumb studio-entry-thumb-${entry.kind}`}>
                    {entry.cover || entry.photos[0]?.src ? (
                      <img src={entry.cover || entry.photos[0].src} alt="" />
                    ) : (
                      <span aria-hidden="true">
                        {entry.kind === 'writing' ? 'Aa' : entry.kind === 'photo' ? '▧' : '↗'}
                      </span>
                    )}
                  </span>
                  <span className="studio-entry-text">
                    <strong>{entry.title || '未命名'}</strong>
                    <span>
                      {kindLabels[entry.kind]}
                      {entry.topics.length > 0 && <> · {entry.topics.join(' / ')}</>}
                      {entry.sample && <> · 示例</>}
                    </span>
                  </span>
                </a>
                <span className={`studio-status ${published ? 'studio-status-published' : ''}`}>
                  {published ? (draft ? '已发布 · 有修改' : '已发布') : '草稿'}
                </span>
                <time className="studio-entry-date" dateTime={entry.updatedAt}>
                  {formatDate(entry.updatedAt)}
                </time>
                <a className="studio-entry-edit" href={`#/studio/edit/${entry.id}`}>
                  编辑 <Arrow />
                </a>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="studio-empty">
          <span className="studio-empty-mark" aria-hidden="true">
            ＋
          </span>
          <h2>{entries.length ? '没有找到内容' : '这里还没有内容'}</h2>
          <p>
            {entries.length
              ? '试试其他关键词，或调整筛选条件。'
              : '可以先存一份草稿，准备好时再发布。'}
          </p>
          {entries.length ? (
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setSearch('')
                setStatus('all')
                setKind('all')
              }}
            >
              清除筛选
            </button>
          ) : (
            <a className="button secondary" href="#/studio/new?kind=writing">
              写第一篇文章
            </a>
          )}
        </div>
      )}
      <p className="studio-bottom-note">
        保存草稿不会改变已发布的内容。准备好后，点击发布即可更新。
      </p>
    </div>
  )
}

function readPhoto(file: File): Promise<Photo> {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type))
    return Promise.reject(new Error(`${file.name}：请选择 JPG、PNG、WebP 或 AVIF 图片。`))
  if (!file.size || file.size > maxImageBytes)
    return Promise.reject(new Error(`${file.name}：文件为空或超过 10 MiB。`))
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`${file.name}：读取失败，请重新选择。`))
    reader.onabort = () => reject(new Error(`${file.name}：读取已取消。`))
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error(`${file.name}：无法读取图片。`))
        return
      }
      const src = reader.result
      const image = new Image()
      image.onload = () => {
        if (!image.naturalWidth || !image.naturalHeight)
          reject(new Error(`${file.name}：图片没有有效尺寸。`))
        else resolve({ id: crypto.randomUUID(), src, alt: '', caption: '' })
      }
      image.onerror = () => reject(new Error(`${file.name}：浏览器无法解码这张图片。`))
      image.src = src
    }
    reader.readAsDataURL(file)
  })
}

function EntryEditor({ id, kind }: { id?: string; kind: EntryKind }) {
  const platform = usePlatform()
  const confirm = useConfirm()
  const existing = id
    ? platform.drafts.find((item) => item.id === id) ||
      platform.entries.find((item) => item.id === id)
    : undefined
  const [entry, setEntry] = useState<Entry>(() =>
    existing
      ? {
          ...existing,
          topics: [...existing.topics],
          photos: existing.photos.map((photo) => ({ ...photo })),
        }
      : newEntry(kind),
  )
  const [topics, setTopics] = useState(() => entry.topics.join('，'))
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const uploadInput = useRef<HTMLInputElement>(null)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  const allowNavigation = useUnsavedWork(dirty || uploading)
  const published = platform.entries.find(
    (item) => item.id === entry.id && item.status === 'published',
  )
  const persisted = !!existing || platform.drafts.some((item) => item.id === entry.id)
  const update = <K extends keyof Entry>(key: K, value: Entry[K]) => {
    setEntry((previous) => ({
      ...previous,
      [key]: value,
      ...(key === 'photos' ? { cover: (value as Photo[])[0]?.src || '' } : {}),
    }))
    setDirty(true)
    setNotice('')
  }
  const normalized = (status: Entry['status']): Entry => ({
    ...entry,
    title: entry.title.trim(),
    summary: entry.summary.trim(),
    destination: entry.destination.trim(),
    topics: [
      ...new Set(
        topics
          .split(/[,，\n]/)
          .map((topic) => topic.trim())
          .filter(Boolean),
      ),
    ],
    cover: entry.photos[0]?.src || entry.cover,
    status,
    updatedAt: new Date().toISOString(),
    publishedAt:
      status === 'published' ? entry.publishedAt || new Date().toISOString() : entry.publishedAt,
  })
  async function save(action: 'draft' | 'publish' | 'preview') {
    if (busy || uploading) return
    setError('')
    setNotice('')
    const next = normalized(action === 'publish' ? 'published' : 'draft')
    if (action === 'publish' && next.destination && !safeDestination(next.destination)) {
      setError('项目链接需要以 https://、http:// 或 #/ 开头。')
      return
    }
    if (action === 'publish') {
      if (!next.title) {
        setError('发布前请填写标题。')
        document.getElementById('entry-title')?.focus()
        return
      }
      if (next.kind === 'writing' && !next.body.trim()) {
        setError('文章还没有正文，可以先保存为草稿。')
        return
      }
      if (next.kind === 'photo' && !next.photos.length) {
        setError('发布影像前，请至少选择一张图片。')
        return
      }
      if (next.kind === 'project' && !next.body.trim() && !safeDestination(next.destination)) {
        setError('请添加项目链接或项目介绍，再发布。')
        return
      }
    }
    setBusy(action)
    try {
      if (action === 'publish') await platform.publishEntry(next)
      else await platform.saveDraft(next)
      if (!mounted.current) return
      const nextTopics = next.topics.join('，')
      setEntry(next)
      setTopics(nextTopics)
      setDirty(false)
      setNotice(action === 'publish' ? '已发布到本机网站。' : '草稿已保存到当前浏览器。')
      if (action === 'preview') {
        allowNavigation()
        go(`/entry/${next.id}?draft=1`)
      } else if (!id) {
        allowNavigation()
        window.history.replaceState(null, '', `#/studio/edit/${next.id}`)
        window.dispatchEvent(new HashChangeEvent('hashchange'))
      }
    } catch (reason) {
      if (mounted.current) setError(errorText(reason))
    } finally {
      if (mounted.current) setBusy('')
    }
  }
  async function upload(files: File[]) {
    if (!files.length || uploading || busy) return
    if (entry.photos.length + files.length > maxPhotos) {
      setError(`每篇内容最多添加 ${maxPhotos} 张图片。当前已有 ${entry.photos.length} 张。`)
      return
    }
    setUploading(true)
    setError('')
    setNotice('')
    const images: Photo[] = []
    const errors: string[] = []
    for (const file of files) {
      if (!mounted.current) return
      try {
        images.push(await readPhoto(file))
      } catch (reason) {
        errors.push(errorText(reason))
      }
    }
    if (!mounted.current) return
    setEntry((previous) => ({
      ...previous,
      photos: [...previous.photos, ...images],
      cover: previous.photos[0]?.src || images[0]?.src || previous.cover,
    }))
    setError(errors.join('\n'))
    setUploading(false)
    if (images.length) {
      setDirty(true)
      setNotice(`已添加 ${images.length} 张图片，保存后才会保留。`)
    }
  }
  function changeFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    void upload(files)
  }
  function movePhoto(index: number, step: number) {
    const photos = [...entry.photos]
    const target = index + step
    if (target < 0 || target >= photos.length) return
    ;[photos[index], photos[target]] = [photos[target], photos[index]]
    update('photos', photos)
  }
  async function unpublish() {
    if (
      !(await confirm({
        title: '撤回这篇内容？',
        description: '它会从本机网站的公开列表中移除，内容和草稿仍会保留。',
        confirmLabel: '撤回草稿',
        cancelLabel: '保持发布',
      }))
    )
      return
    setBusy('unpublish')
    setError('')
    try {
      await platform.unpublishEntry(entry.id)
      setNotice('已撤回草稿。')
    } catch (reason) {
      setError(errorText(reason))
    } finally {
      setBusy('')
    }
  }
  async function remove() {
    if (
      !(await confirm({
        title: '删除这篇内容？',
        description: `「${entry.title || '未命名'}」及它的草稿将被删除。此操作无法撤销。`,
        confirmLabel: '删除内容',
        cancelLabel: '保留内容',
        danger: true,
      }))
    )
      return
    setBusy('delete')
    setError('')
    try {
      await platform.deleteEntry(entry.id)
      allowNavigation()
      go('/studio')
    } catch (reason) {
      setError(errorText(reason))
      setBusy('')
    }
  }
  if (id && !existing)
    return (
      <div className="studio-content studio-empty">
        <h1>没有找到这篇内容</h1>
        <p>它可能已经删除，或不在当前浏览器中。</p>
        <a className="button secondary" href="#/studio">
          返回内容
        </a>
      </div>
    )
  return (
    <div className="studio-editor-wrap">
      <h1 className="sr-only">
        {id ? '编辑' : '新建'}
        {kindLabels[entry.kind]}
      </h1>
      <div className="studio-editor-top">
        <a className="studio-back" href="#/studio">
          <Arrow direction="left" />
          内容
        </a>
        <div className="studio-editor-actions">
          <span className="studio-save-state" aria-live="polite">
            {uploading
              ? '正在读取图片…'
              : busy
                ? '正在保存…'
                : dirty
                  ? '有未保存的修改'
                  : persisted
                    ? '已保存到本机'
                    : '尚未保存'}
          </span>
          <button
            type="button"
            className="button quiet"
            disabled={!!busy || uploading}
            onClick={() => void save('preview')}
          >
            预览
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={!!busy || uploading}
            onClick={() => void save('draft')}
          >
            {busy === 'draft' ? '保存中…' : '保存草稿'}
          </button>
          <button
            type="button"
            className="button"
            disabled={!!busy || uploading}
            onClick={() => void save('publish')}
          >
            {busy === 'publish' ? '发布中…' : published ? '更新发布' : '发布'}
          </button>
        </div>
      </div>
      {(error || notice) && (
        <div className="studio-editor-feedback">
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
        </div>
      )}
      <form className="studio-editor-grid" onSubmit={(event) => event.preventDefault()}>
        <fieldset className="studio-editor-sheet" disabled={!!busy || uploading}>
          <legend className="sr-only">{kindLabels[entry.kind]}编辑器</legend>
          <div className="studio-sheet-top">
            <span>{kindLabels[entry.kind]}</span>
            <span>{published ? '已发布内容的编辑副本' : '草稿'}</span>
          </div>
          <label htmlFor="entry-title" className="sr-only">
            标题
          </label>
          <input
            id="entry-title"
            className="studio-title-input"
            value={entry.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder="标题"
            autoComplete="off"
            maxLength={150}
          />
          {entry.kind === 'project' && (
            <label className="field studio-project-url">
              <span className="field-label">
                项目链接 <span className="muted">可选</span>
              </span>
              <input
                type="text"
                inputMode="url"
                value={entry.destination}
                onChange={(event) => update('destination', event.target.value)}
                placeholder="https://"
              />
              <small className="muted">
                独立网站可直接访问，也可以留空，使用下方介绍作为项目页面。
              </small>
            </label>
          )}
          {entry.kind !== 'writing' && (
            <div className="studio-main-images">
              <div
                className={`studio-upload ${dragging ? 'is-dragging' : ''}`}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragging(false)
                  void upload(Array.from(event.dataTransfer.files))
                }}
              >
                <span className="studio-upload-plus" aria-hidden="true">
                  ＋
                </span>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => uploadInput.current?.click()}
                >
                  {entry.photos.length
                    ? '继续添加图片'
                    : entry.kind === 'photo'
                      ? '选择照片'
                      : '添加项目图片'}
                </button>
                <p>也可以拖放图片到这里</p>
                <small>JPG / PNG / WebP / AVIF · 每张不超过 10 MiB · 最多 20 张</small>
              </div>
              {entry.photos.length > 0 && (
                <PhotoEditor
                  photos={entry.photos}
                  update={(photos) => update('photos', photos)}
                  move={movePhoto}
                />
              )}
            </div>
          )}
          <label htmlFor="entry-body" className="studio-body-label">
            {entry.kind === 'writing' ? '正文' : entry.kind === 'project' ? '项目介绍' : '说明'}
            {entry.kind !== 'writing' && <span>可选</span>}
          </label>
          <textarea
            id="entry-body"
            className={`studio-body-input ${entry.kind === 'writing' ? '' : 'is-short'}`}
            value={entry.body}
            onChange={(event) => update('body', event.target.value)}
            placeholder={
              entry.kind === 'writing'
                ? '从这里开始写……'
                : entry.kind === 'project'
                  ? '这个项目是做什么的？'
                  : '拍摄地点、时间，或想留在这里的话。'
            }
          />
          <p className="studio-text-help">
            用 ## 开头写小标题，空一行分段。
            {entry.body.length > 0 && <span>{entry.body.length.toLocaleString('zh-CN')} 字符</span>}
          </p>
          {entry.kind === 'writing' && (
            <details className="studio-inline-images">
              <summary>配图{entry.photos.length > 0 && ` · ${entry.photos.length} 张`}</summary>
              <p className="muted">第一张用于封面，所有配图会显示在正文之后。</p>
              <button
                type="button"
                className="button secondary"
                onClick={() => uploadInput.current?.click()}
              >
                添加图片
              </button>
              {entry.photos.length > 0 && (
                <PhotoEditor
                  photos={entry.photos}
                  update={(photos) => update('photos', photos)}
                  move={movePhoto}
                />
              )}
            </details>
          )}
          <input
            ref={uploadInput}
            className="sr-only"
            aria-label="选择图片文件"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            onChange={changeFiles}
            tabIndex={-1}
          />
        </fieldset>
        <aside className="studio-editor-side">
          <fieldset disabled={!!busy || uploading}>
            <legend>整理与展示</legend>
            <label className="field">
              <span className="field-label">主题</span>
              <input
                value={topics}
                onChange={(event) => {
                  setTopics(event.target.value)
                  setDirty(true)
                  setNotice('')
                }}
                placeholder="例如：阅读，旅行"
              />
              <small className="muted">用逗号分开，可以以后再整理。</small>
            </label>
            <label className="studio-check">
              <input
                type="checkbox"
                checked={entry.featured}
                onChange={(event) => update('featured', event.target.checked)}
              />
              <span>在首页精选中展示</span>
            </label>
            <label className="studio-check">
              <input
                type="checkbox"
                checked={entry.discussion}
                onChange={(event) => update('discussion', event.target.checked)}
              />
              <span>允许留言</span>
            </label>
            <details className="studio-extra">
              <summary>更多信息</summary>
              <label className="field">
                <span className="field-label">摘要</span>
                <textarea
                  rows={4}
                  value={entry.summary}
                  onChange={(event) => update('summary', event.target.value)}
                  placeholder="可选，显示在内容列表里"
                  maxLength={400}
                />
              </label>
              <p className="muted">
                发布前可以预览；保存草稿会保留修改，网站上的已发布版本仍保持原样。
              </p>
            </details>
          </fieldset>
          <div className="studio-side-foot">
            {published && <p>首次发布于 {formatDate(published.publishedAt)}</p>}
            {published && (
              <button
                type="button"
                className="studio-text-action"
                disabled={!!busy || uploading}
                onClick={() => void unpublish()}
              >
                撤回草稿
              </button>
            )}
            {persisted && (
              <button
                type="button"
                className="studio-text-action studio-text-danger"
                disabled={!!busy || uploading}
                onClick={() => void remove()}
              >
                删除这篇内容
              </button>
            )}
          </div>
        </aside>
      </form>
    </div>
  )
}

function PhotoEditor({
  photos,
  update,
  move,
}: {
  photos: Photo[]
  update: (photos: Photo[]) => void
  move: (index: number, step: number) => void
}) {
  const confirm = useConfirm()
  const changePhoto = (id: string, key: 'alt' | 'caption', value: string) =>
    update(photos.map((photo) => (photo.id === id ? { ...photo, [key]: value } : photo)))
  return (
    <div className="studio-photo-list">
      {photos.map((photo, index) => (
        <div className="studio-photo-editor" key={photo.id}>
          <div className="studio-photo-preview">
            <img src={photo.src} alt={photo.alt} />
            <span>
              {String(index + 1).padStart(2, '0')}
              {index === 0 && ' / 封面'}
            </span>
          </div>
          <div className="studio-photo-fields">
            <label className="field">
              <span className="field-label">图片说明</span>
              <input
                value={photo.caption}
                onChange={(event) => changePhoto(photo.id, 'caption', event.target.value)}
                placeholder="可选"
              />
            </label>
            <label className="field">
              <span className="field-label">替代文字</span>
              <input
                value={photo.alt}
                onChange={(event) => changePhoto(photo.id, 'alt', event.target.value)}
                placeholder="描述画面，便于使用屏幕阅读器的人浏览"
              />
            </label>
            <div className="studio-photo-controls">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => move(index, -1)}
                aria-label={`将第 ${index + 1} 张图片前移`}
              >
                前移
              </button>
              <button
                type="button"
                disabled={index === photos.length - 1}
                onClick={() => move(index, 1)}
                aria-label={`将第 ${index + 1} 张图片后移`}
              >
                后移
              </button>
              <button
                type="button"
                className="studio-remove-photo"
                onClick={async () => {
                  if (
                    await confirm({
                      title: '移除这张图片？',
                      description: '图片会从当前编辑内容中移除。保存前仍可放弃这次修改。',
                      confirmLabel: '移除图片',
                      cancelLabel: '保留图片',
                    })
                  )
                    update(photos.filter((item) => item.id !== photo.id))
                }}
                aria-label={`移除第 ${index + 1} 张图片`}
              >
                移除
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SettingsPage() {
  const platform = usePlatform()
  const [settings, setSettings] = useState<Settings>(() => ({ ...platform.state.settings }))
  const [saved, setSaved] = useState(() => JSON.stringify(platform.state.settings))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const dirty = JSON.stringify(settings) !== saved
  useUnsavedWork(dirty)
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((previous) => ({ ...previous, [key]: value }))
    setNotice('')
  }
  async function save() {
    if (!settings.name.trim()) {
      setError('请填写网站名称。')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    const next = { ...settings, name: settings.name.trim(), intro: settings.intro.trim() }
    try {
      await platform.updateSettings(next)
      setSettings(next)
      setSaved(JSON.stringify(next))
      setNotice('设置已保存，网站已更新。')
    } catch (reason) {
      setError(errorText(reason))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="studio-content">
      <div className="studio-page-title">
        <div>
          <p className="eyebrow">工作台 / 设置</p>
          <h1>网站设置</h1>
          <p className="muted">名字、介绍，以及网站打开时的样子。</p>
        </div>
      </div>
      <div className="studio-settings-grid">
        <form
          className="studio-settings-form"
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
        >
          <fieldset disabled={busy}>
            <legend className="sr-only">网站信息</legend>
            <label className="field">
              <span className="field-label">网站名称</span>
              <input
                value={settings.name}
                onChange={(event) => update('name', event.target.value)}
                maxLength={60}
                required
              />
            </label>
            <label className="field">
              <span className="field-label">首页介绍</span>
              <textarea
                rows={3}
                value={settings.intro}
                onChange={(event) => update('intro', event.target.value)}
                maxLength={300}
                placeholder="可选，简单介绍这个地方"
              />
            </label>
            <label className="field">
              <span className="field-label">关于页面</span>
              <textarea
                className="studio-about-input"
                rows={8}
                value={settings.about}
                onChange={(event) => update('about', event.target.value)}
                placeholder="写一点关于自己的内容，也可以留空。"
              />
              <small className="muted">支持分段和 ## 小标题。</small>
            </label>
            <fieldset className="studio-home-view">
              <legend>首页默认视图</legend>
              <label>
                <input
                  type="radio"
                  name="home-view"
                  value="grid"
                  checked={settings.homeView === 'grid'}
                  onChange={() => update('homeView', 'grid')}
                />
                <span>
                  <strong>画廊</strong>
                  <small>保留图片和内容的不同形状</small>
                </span>
              </label>
              <label>
                <input
                  type="radio"
                  name="home-view"
                  value="list"
                  checked={settings.homeView === 'list'}
                  onChange={() => update('homeView', 'list')}
                />
                <span>
                  <strong>目录</strong>
                  <small>紧凑地浏览标题和分类</small>
                </span>
              </label>
            </fieldset>
          </fieldset>
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
          <div className="studio-settings-actions">
            <button className="button" type="submit" disabled={busy || !dirty}>
              {busy ? '保存中…' : '保存设置'}
            </button>
            <span className="muted">{dirty ? '有未保存的修改' : '修改后可以保存'}</span>
          </div>
        </form>
        <aside className="studio-settings-preview">
          <p className="eyebrow">网站信息预览</p>
          <div className="studio-identity-preview">
            <span className="studio-brand-mark" aria-hidden="true">
              m.
            </span>
            <h2>{settings.name || '网站名称'}</h2>
            <p>{settings.intro || '首页介绍会显示在这里。'}</p>
          </div>
          <p className="muted">这里只修改网站信息。文章、照片和项目分别保存在内容里。</p>
        </aside>
      </div>
    </div>
  )
}

function CommentsPage() {
  const platform = usePlatform()
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all')
  const [target, setTarget] = useState('all')
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const messages = platform.state.messages
    .filter(
      (message) =>
        (filter === 'all' || (filter === 'hidden' ? message.hidden : !message.hidden)) &&
        (target === 'all' ||
          (target === 'guestbook'
            ? message.targetId === 'guestbook'
            : message.targetId !== 'guestbook')) &&
        `${message.authorName} ${message.body}`.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  async function moderate(id: string, hidden: boolean) {
    setBusy(id)
    setError('')
    setNotice('')
    try {
      await platform.moderateMessage(id, hidden)
      setNotice(hidden ? '留言已隐藏。' : '留言已恢复显示。')
    } catch (reason) {
      setError(errorText(reason))
    } finally {
      setBusy('')
    }
  }
  return (
    <div className="studio-content">
      <div className="studio-page-title">
        <div>
          <p className="eyebrow">工作台 / 留言</p>
          <h1>留言</h1>
          <p className="muted">查看留言，暂时隐藏不适合公开的内容。</p>
        </div>
        <a className="button secondary" href="#/guestbook">
          去留言板 <Arrow />
        </a>
      </div>
      <div className="studio-library-head">
        <h2>
          留言 <span>{platform.state.messages.length}</span>
        </h2>
        <label className="studio-search">
          <span className="sr-only">搜索留言</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索昵称或留言"
          />
        </label>
      </div>
      <div className="studio-library-filters">
        <div className="studio-tabs" aria-label="留言状态">
          {(
            [
              ['all', '全部'],
              ['visible', '可见'],
              ['hidden', '已隐藏'],
            ] as const
          ).map(([value, label]) => (
            <button
              type="button"
              key={value}
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="studio-kind-select">
          <span className="sr-only">留言来源</span>
          <select value={target} onChange={(event) => setTarget(event.target.value)}>
            <option value="all">全部来源</option>
            <option value="guestbook">留言板</option>
            <option value="entry">内容讨论</option>
          </select>
        </label>
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
      {messages.length ? (
        <div className="studio-message-list">
          {messages.map((message) => {
            const entry = platform.entries.find((item) => item.id === message.targetId)
            return (
              <article
                key={message.id}
                className={`studio-message ${message.hidden ? 'is-hidden' : ''}`}
              >
                <div className="studio-message-meta">
                  <strong>{message.authorName}</strong>
                  <time dateTime={message.createdAt}>{formatDate(message.createdAt)}</time>
                  {message.hidden && <span className="studio-status">已隐藏</span>}
                  <span className="studio-message-origin">
                    {message.parentId ? '回复 · ' : ''}
                    {message.targetId === 'guestbook' ? (
                      <a href="#/guestbook">留言板</a>
                    ) : entry?.status === 'published' ? (
                      <a href={`#/entry/${entry.id}`}>{entry.title || '未命名'}</a>
                    ) : (
                      '已撤下的内容'
                    )}
                  </span>
                </div>
                <p>{message.body}</p>
                <div className="studio-message-actions">
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => void moderate(message.id, !message.hidden)}
                  >
                    {busy === message.id ? '处理中…' : message.hidden ? '恢复显示' : '隐藏留言'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="studio-empty">
          <span className="studio-empty-mark" aria-hidden="true">
            “
          </span>
          <h2>{platform.state.messages.length ? '没有符合条件的留言' : '还没有留言'}</h2>
          <p>
            {platform.state.messages.length
              ? '调整筛选条件，查看其他留言。'
              : '留言板和内容下的讨论会显示在这里。'}
          </p>
          {platform.state.messages.length > 0 && (
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setFilter('all')
                setTarget('all')
                setQuery('')
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

export function StudioPage({ path, params }: { path: string; params: URLSearchParams }) {
  const platform = usePlatform()
  const requestedKind = params.get('kind') as EntryKind
  const kind = kinds.includes(requestedKind) ? requestedKind : 'writing'
  return (
    <div className="studio">
      <StudioHeader path={path} />
      <div className="studio-main">
        <LocalNote />
        {platform.error && (
          <p className="form-error studio-global-error" role="alert">
            {platform.error}
          </p>
        )}
        {!platform.ready ? (
          <div className="studio-content">
            <p role="status">正在读取本机内容…</p>
          </div>
        ) : path === '/studio/settings' ? (
          <SettingsPage />
        ) : path === '/studio/comments' ? (
          <CommentsPage />
        ) : path === '/studio/new' ? (
          <EntryEditor key={`new-${kind}`} kind={kind} />
        ) : path.startsWith('/studio/edit/') ? (
          <EntryEditor key={path} id={path.slice('/studio/edit/'.length)} kind="writing" />
        ) : (
          <ContentList />
        )}
      </div>
      <footer className="studio-footer">
        <span>{platform.state.settings.name}</span>
        <span>本机工作台</span>
      </footer>
    </div>
  )
}
