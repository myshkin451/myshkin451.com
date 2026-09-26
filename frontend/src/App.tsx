import { entryLabel, kindLabels, type Entry, type EntryKind } from './types'
import { SiteLink } from './navigation'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useRoute } from './navigation'
import { usePlatform } from './platform'
import { Icon } from './ui'
import { PublicPage, rememberCollection } from './pages/Public'
import { ColorLab } from './pages/ColorLab'
import { CommunityPage } from './pages/Community'
import { StudioPage } from './pages/Studio'

function PreviewDock() {
  const { state, setMode } = usePlatform()
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)
  const appliedPreview = useRef(false)

  useEffect(() => {
    if (appliedPreview.current) return
    appliedPreview.current = true
    // The explicit preview URL opts into fixtures only in the local application.
    // The remote application never mounts this dock or seeds sample content.
    if (new URLSearchParams(window.location.search).get('preview') !== 'sample') return
    if (state.mode === 'sample') return
    void setMode('sample').catch((cause: unknown) => {
      setFailure(cause instanceof Error ? cause.message : '样例未能打开，请重试。')
    })
  }, [setMode, state.mode])

  async function changeMode() {
    setPending(true)
    setFailure('')
    try {
      await setMode(state.mode === 'sample' ? 'empty' : 'sample')
    } catch (error) {
      setFailure(error instanceof Error ? error.message : '切换失败，请重试。')
    } finally {
      setPending(false)
    }
  }
  return (
    <details className="preview-tools">
      <summary>本机预览</summary>
      <aside className="preview-dock" aria-label="前端预览工具">
        <button
          className="preview-info"
          onClick={() => dialog.current?.showModal()}
          aria-label="了解这个前端预览"
        >
          <span className="preview-dot" />
          本机预览
        </button>
        <span className="dock-divider" />
        <button onClick={changeMode} disabled={pending} aria-pressed={state.mode === 'sample'}>
          {state.mode === 'sample' ? '样例已显示' : '仅我的内容'}
          <span className={`dock-toggle ${state.mode === 'sample' ? 'on' : ''}`} />
        </button>
        <SiteLink className="dock-studio" href="#/studio">
          工作台
          <Icon name="external" size={13} />
        </SiteLink>
      </aside>
      {failure && (
        <p className="dock-error" role="alert">
          {failure}
        </p>
      )}
      <dialog className="preview-dialog" ref={dialog}>
        <div className="dialog-heading">
          <h2>关于这个预览</h2>
          <button
            className="icon-button"
            onClick={() => dialog.current?.close()}
            aria-label="关闭说明"
          >
            <Icon name="close" />
          </button>
        </div>
        <p>
          你可以浏览页面，也可以在工作台写文章、上传照片和添加项目。发布后，会立即出现在本机首页。
        </p>
        <p>
          内容保存在当前浏览器中。清除浏览器数据会移除这些内容；切换浏览器、设备或访问地址不会同步。
        </p>
        <p>访客账号和留言是本机演示。这里没有真实注册、密码或邮件，也没有把内容发布到互联网。</p>
        <p>样例文章与 AI 生成图片用于展示排版。关闭样例，就能看到只包含自己内容的首页。</p>
        <SiteLink className="button" href="#/studio" onClick={() => dialog.current?.close()}>
          进入工作台
          <Icon name="arrow" />
        </SiteLink>
      </dialog>
    </details>
  )
}

function SiteSearch({
  entries,
  onClose,
  returnFocus,
}: {
  entries: Entry[]
  onClose: () => void
  returnFocus: HTMLElement | null
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const headingId = useId()
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState<EntryKind | ''>('')
  const term = query.trim().toLocaleLowerCase()
  const published = entries
    .filter((entry) => entry.status === 'published')
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.id.localeCompare(a.id))
  const found = published.filter(
    (entry) =>
      (!kind || entry.kind === kind) &&
      (!term ||
        `${entryLabel(entry)} ${entry.summary} ${entry.body} ${entry.topics.join(' ')}`
          .toLocaleLowerCase()
          .includes(term)),
  )
  const shown = found.slice(0, 12)
  const queryParams = new URLSearchParams()
  if (query.trim()) queryParams.set('q', query.trim())
  if (kind) queryParams.set('kind', kind)
  const allResults = '#/archive' + (queryParams.size ? `?${queryParams}` : '')

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    const previousOverflow = document.body.style.overflow
    element.showModal()
    document.body.style.overflow = 'hidden'
    input.current?.focus()
    return () => {
      element.close()
      document.body.style.overflow = previousOverflow
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true })
    }
  }, [returnFocus])

  return (
    <dialog
      ref={dialog}
      className="site-search-dialog"
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
        const links = Array.from(
          dialog.current?.querySelectorAll<HTMLAnchorElement>('[data-search-result]') || [],
        )
        const current = links.findIndex((link) => link === document.activeElement)
        if (
          links.length &&
          (event.target === input.current || current >= 0) &&
          ['ArrowDown', 'ArrowUp'].includes(event.key)
        ) {
          event.preventDefault()
          const next =
            event.key === 'ArrowDown'
              ? (current + 1) % links.length
              : current <= 0
                ? links.length - 1
                : current - 1
          links[next]?.focus()
        }
        if (event.key === 'Enter' && event.target === input.current && links.length) {
          event.preventDefault()
          links[0].click()
        }
      }}
    >
      <div className="site-search-panel">
        <header className="site-search-heading">
          <h2 id={headingId}>搜索网站</h2>
          <button
            className="site-search-close"
            type="button"
            onClick={onClose}
            aria-label="关闭搜索"
          >
            <span>关闭</span>
            <Icon name="close" size={18} />
          </button>
        </header>
        <label className="site-search-input">
          <Icon name="search" size={22} />
          <span className="sr-only">搜索公开内容</span>
          <input
            ref={input}
            type="search"
            placeholder="查找文章、影像、项目或随记"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="site-search-filters" role="group" aria-label="搜索内容类型">
          <button type="button" aria-pressed={!kind} onClick={() => setKind('')}>
            全部
          </button>
          {(Object.keys(kindLabels) as EntryKind[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={kind === value}
              onClick={() => setKind(value)}
            >
              {kindLabels[value]}
            </button>
          ))}
        </div>
        <div className="site-search-results">
          <p className="site-search-count" role="status">
            {term || kind ? `${found.length} 项匹配内容` : '最近发布'}
            {found.length > shown.length && <span>显示前 {shown.length} 项</span>}
          </p>
          <ul>
            {shown.map((entry) => (
              <li key={entry.id}>
                <SiteLink
                  href={`#/entry/${encodeURIComponent(entry.id)}`}
                  data-search-result
                  onClick={() => {
                    rememberCollection(allResults)
                    onClose()
                  }}
                >
                  <span className="site-search-kind">
                    {kindLabels[entry.kind]}
                    {entry.sample && <small>样例</small>}
                  </span>
                  <span className="site-search-copy">
                    <strong>{entryLabel(entry)}</strong>
                    {entry.summary && <span>{entry.summary}</span>}
                  </span>
                  <Icon name="arrow" size={18} />
                </SiteLink>
              </li>
            ))}
          </ul>
          {!shown.length && (
            <p className="site-search-empty">
              {published.length ? '没有找到相应内容，试试其他关键词或类型。' : '还没有公开的内容。'}
            </p>
          )}
        </div>
        <footer className="site-search-foot">
          <span>↑ ↓ 选择 · Enter 打开 · Esc 关闭</span>
          <SiteLink href={allResults} onClick={onClose}>
            {term || kind ? '在内容页查看' : '全部内容'}
            <Icon name="arrow" size={15} />
          </SiteLink>
        </footer>
      </div>
    </dialog>
  )
}

function SiteHeader({ path }: { path: string }) {
  const { state, entries } = usePlatform()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [returnFocus, setReturnFocus] = useState<HTMLElement | null>(null)
  const menuButton = useRef<HTMLButtonElement>(null)
  const nav = useRef<HTMLElement>(null)
  const navId = useId()
  const closeSearch = useCallback(() => setSearchOpen(false), [])
  const currentEntry = entries.find((entry) => path === '/entry/' + encodeURIComponent(entry.id))
  const links = [
    {
      href: '/',
      title: '作品',
      active:
        ['/', '/archive', '/writing', '/photos', '/projects'].includes(path) ||
        path.startsWith('/topics/') ||
        path.startsWith('/play/') ||
        Boolean(currentEntry && currentEntry.kind !== 'note'),
    },
    { href: '/notes', title: '随记', active: path === '/notes' || currentEntry?.kind === 'note' },
    { href: '/about', title: '关于', active: path === '/about' },
  ]

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === 'k' &&
        !document.querySelector('dialog[open]')
      ) {
        event.preventDefault()
        setReturnFocus(
          menuOpen
            ? menuButton.current
            : document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null,
        )
        setSearchOpen(true)
        setMenuOpen(false)
      }
      if (event.key === 'Escape' && menuOpen) {
        setMenuOpen(false)
        menuButton.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  useEffect(() => {
    if (menuOpen) nav.current?.querySelector('a')?.focus()
  }, [menuOpen])

  return (
    <>
      <header className="site-header">
        <SiteLink
          className="site-brand"
          href="#/"
          aria-label={`${state.settings.name} 首页`}
          title={state.settings.name}
          onClick={() => setMenuOpen(false)}
        >
          {state.settings.name}
        </SiteLink>
        <nav
          ref={nav}
          id={navId}
          className={`site-nav${menuOpen ? ' is-open' : ''}`}
          aria-label="网站导航"
          onClick={() => {
            setMenuOpen(false)
            document.getElementById('main')?.focus({ preventScroll: true })
          }}
        >
          {links.map((link) => (
            <SiteLink
              key={link.href}
              href={`#${link.href}`}
              aria-current={link.active ? 'page' : undefined}
            >
              {link.title}
            </SiteLink>
          ))}
          <SiteLink className="site-nav-secondary" href="#/archive">
            全部内容
          </SiteLink>
          <SiteLink className="site-nav-secondary" href="#/guestbook">
            留言
          </SiteLink>
        </nav>
        <div className="site-header-actions">
          <button
            className="site-search-trigger"
            type="button"
            aria-label="搜索网站"
            aria-haspopup="dialog"
            onClick={(event) => {
              setReturnFocus(event.currentTarget)
              setSearchOpen(true)
              setMenuOpen(false)
            }}
          >
            <Icon name="search" size={18} />
            <span>搜索</span>
            <kbd>⌘ K</kbd>
          </button>
          <SiteLink
            className="account-link"
            href={state.visitor ? '#/account' : '#/login'}
            onClick={() => setMenuOpen(false)}
          >
            {state.visitor ? (
              <>
                <span className="visitor-avatar">{[...state.visitor.nickname][0]}</span>
                <span className="sr-only">我的账号</span>
              </>
            ) : (
              '登录'
            )}
          </SiteLink>
          <button
            ref={menuButton}
            className="site-menu-trigger"
            type="button"
            aria-expanded={menuOpen}
            aria-controls={navId}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? '关闭' : '菜单'}
          </button>
        </div>
      </header>
      {searchOpen && (
        <SiteSearch entries={entries} onClose={closeSearch} returnFocus={returnFocus} />
      )}
    </>
  )
}

export default function App() {
  const { path, params } = useRoute()
  const { ready, error, state, entries, drafts, remote, isOwner, authReady } = usePlatform()
  const studio = path.startsWith('/studio')
  const previousPath = useRef(path)
  let entryId = ''
  try {
    if (path.startsWith('/entry/')) entryId = decodeURIComponent(path.slice(7))
  } catch {
    /* The route renders a not-found page. */
  }
  const currentEntry = (params.get('draft') === '1' ? drafts : entries).find(
    (entry) => entry.id === entryId,
  )
  const entryTitle = currentEntry ? entryLabel(currentEntry) : undefined
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (previousPath.current !== path) {
      document.getElementById('main')?.focus({ preventScroll: true })
      previousPath.current = path
    }
  }, [path])
  useEffect(() => {
    const titles: Record<string, string> = {
      '/archive': '全部内容',
      '/notes': '随记',
      '/studio/notes': '随记',
      '/writing': '文章',
      '/photos': '影像',
      '/projects': '项目',
      '/about': '关于',
      '/guestbook': '留言',
      '/login': '登录',
      '/register': '注册',
      '/account': '我的账号',
      '/recover': '找回账号',
      '/studio': '工作台',
      '/studio/settings': '网站设置',
      '/studio/comments': '留言管理',
      '/play/color': '色彩练习',
    }
    const title = entryTitle || titles[path] || (studio ? '内容编辑' : '')
    document.title = `${title ? `${title} · ` : ''}${state.settings.name}`
  }, [path, state.settings.name, entryTitle, studio])

  if (!ready)
    return (
      <div className="app-loading" role="status">
        正在打开内容
        <span />
      </div>
    )
  const community = [
    '/guestbook',
    '/login',
    '/register',
    '/recover',
    '/account',
    '/auth/callback',
  ].includes(path)
  return (
    <>
      <SiteLink
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main')?.focus()
        }}
      >
        跳到主要内容
      </SiteLink>
      {error && (
        <div className="storage-error" role="alert">
          {error}
        </div>
      )}
      {studio ? (
        <main id="main" tabIndex={-1}>
          {remote && !isOwner ? (
            <section className="community-auth-page">
              <div className="community-auth-panel">
                <h1>工作台</h1>
                <p>
                  {!authReady
                    ? '正在验证身份…'
                    : state.visitor
                      ? '当前账号没有管理权限。'
                      : '请先登录管理者账号。'}
                </p>
                {authReady && (
                  <SiteLink
                    className="button"
                    href={
                      '#/login?return=' +
                      encodeURIComponent(path + (params.size ? '?' + params.toString() : ''))
                    }
                  >
                    登录
                  </SiteLink>
                )}
                <SiteLink href="#/">返回首页</SiteLink>
              </div>
            </section>
          ) : (
            <StudioPage path={path} params={params} />
          )}
        </main>
      ) : (
        <>
          <SiteHeader key={path} path={path} />
          <main id="main" className={`public-main ${path === '/' ? 'is-home' : ''}`} tabIndex={-1}>
            {community ? (
              <CommunityPage key={path} path={path} params={params} />
            ) : path === '/play/color' ? (
              <ColorLab />
            ) : (
              <PublicPage path={path} params={params} />
            )}
          </main>
          <footer className="site-footer">
            <SiteLink className="site-footer-brand" href="#/">
              {state.settings.name}
            </SiteLink>
            <div className="site-footer-links">
              <SiteLink href="#/archive">全部内容</SiteLink>
              <SiteLink href="#/about">关于</SiteLink>
              <SiteLink href="#/guestbook">留言</SiteLink>
              {(!remote || isOwner) && <SiteLink href="#/studio">管理</SiteLink>}
            </div>
            <span>© {new Date().getFullYear()}</span>
          </footer>
          {!remote && <PreviewDock />}
        </>
      )}
    </>
  )
}
