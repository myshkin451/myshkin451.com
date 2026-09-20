import { SiteLink } from './navigation'
import { useEffect, useRef, useState } from 'react'
import { useRoute } from './navigation'
import { usePlatform } from './platform'
import { Icon } from './ui'
import { PublicPage } from './pages/Public'
import { ColorLab } from './pages/ColorLab'
import { CommunityPage } from './pages/Community'
import { StudioPage } from './pages/Studio'

function PreviewDock() {
  const { state, setMode } = usePlatform()
  const [pending, setPending] = useState(false)
  const [failure, setFailure] = useState('')
  const dialog = useRef<HTMLDialogElement>(null)

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

function SiteHeader({ path }: { path: string }) {
  const { state } = usePlatform()
  const links = [
    {
      href: '/archive',
      title: '内容',
      active:
        ['/archive', '/writing', '/photos', '/projects'].includes(path) ||
        path.startsWith('/topics') ||
        path.startsWith('/entry') ||
        path.startsWith('/play'),
    },
    { href: '/about', title: '关于', active: path === '/about' },
    { href: '/guestbook', title: '留言', active: path === '/guestbook' },
  ]
  return (
    <header className="site-header">
      <SiteLink className="site-brand" href="#/" aria-label={`${state.settings.name} 首页`}>
        <span>{state.settings.name}</span>
      </SiteLink>
      <nav className="site-nav" aria-label="网站导航">
        {links.map((link) => (
          <SiteLink
            key={link.href}
            href={`#${link.href}`}
            aria-current={link.active ? 'page' : undefined}
          >
            {link.title}
          </SiteLink>
        ))}
      </nav>
      <SiteLink className="account-link" href={state.visitor ? '#/account' : '#/login'}>
        {state.visitor ? (
          <>
            <span className="visitor-avatar">{state.visitor.nickname.slice(0, 1)}</span>
            <span className="sr-only">我的账号</span>
          </>
        ) : (
          '登录'
        )}
      </SiteLink>
    </header>
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
  const entryTitle = (params.get('draft') === '1' ? drafts : entries).find(
    (entry) => entry.id === entryId,
  )?.title
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
                  <SiteLink className="button" href="#/login?return=/studio">
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
          <SiteHeader path={path} />
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
            <span>
              © {new Date().getFullYear()} {state.settings.name}
            </span>
            <SiteLink href="#/archive">
              全部内容
              <Icon name="arrow" size={14} />
            </SiteLink>
            <SiteLink href="#/guestbook">留言</SiteLink>
          </footer>
          {!remote && <PreviewDock />}
        </>
      )}
    </>
  )
}
