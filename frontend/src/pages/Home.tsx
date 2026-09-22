import { SiteLink } from '../navigation'
import { usePlatform } from '../platform'
import { Icon, Stream } from '../ui'
import { kindLabels } from '../types'
import type { EntryKind } from '../types'
import './home.css'

const sections: { kind: EntryKind; href: string }[] = [
  { kind: 'writing', href: '#/writing' },
  { kind: 'photo', href: '#/photos' },
  { kind: 'project', href: '#/projects' },
  { kind: 'note', href: '#/notes' },
]

export function Home({ onVisit }: { onVisit: () => void }) {
  const { state, entries } = usePlatform()
  const published = entries.filter((entry) => entry.status === 'published')
  const byDate = (a: { publishedAt: string }, b: { publishedAt: string }) =>
    b.publishedAt.localeCompare(a.publishedAt)
  // One featured entry leads the page; everything after it stays in strict date order
  // so the stream reads as a ledger rather than a curated grid.
  const sorted = [...published].sort(byDate)
  const lead = sorted.find((entry) => entry.featured)
  const recent = [...(lead ? [lead] : []), ...sorted.filter((entry) => entry !== lead)].slice(0, 6)
  const intro =
    state.settings.intro ||
    `这是 ${state.settings.name} 的个人网站。文章、影像、项目和随记，都会放在这里。`

  return (
    <div className={`page home ${published.length ? 'home-populated' : 'home-empty'}`}>
      <aside className="margin" aria-hidden="true">
        <span className="running-head">近况</span>
      </aside>
      <div className="content">
        <section className="home-front" aria-labelledby="home-heading">
          <h1 id="home-heading" className="home-intro">
            {intro}
          </h1>
          <nav className="home-sections" aria-label="浏览内容">
            {sections.map(({ kind, href }) => {
              const count = published.filter((entry) => entry.kind === kind).length
              return (
                <SiteLink key={kind} href={href}>
                  {kindLabels[kind]}
                  {count > 0 && <span className="home-count">{count}</span>}
                </SiteLink>
              )
            })}
            <SiteLink href="#/guestbook" className="home-guestbook">
              留言
              <Icon name="arrow" size={14} />
            </SiteLink>
          </nav>
        </section>
      </div>
      {recent.length > 0 ? (
        <section className="home-recent" aria-labelledby="home-recent-heading" onClick={onVisit}>
          <h2 id="home-recent-heading" className="sr-only">
            近况
          </h2>
          <Stream entries={recent} label="最近发布">
            <li className="stream-foot">
              <span className="stamp" aria-hidden="true" />
              <div className="stream-body">
                <SiteLink className="stream-action" href="#/archive">
                  全部内容
                  <Icon name="arrow" size={15} />
                </SiteLink>
                <span className="home-foot-note">
                  {published.every((entry) => entry.sample)
                    ? '正在展示排版样例'
                    : `共 ${published.length} 项公开内容`}
                </span>
              </div>
            </li>
          </Stream>
        </section>
      ) : (
        <section className="home-quiet" aria-label="当前状态">
          <span className="stamp" aria-hidden="true" />
          <p>还没有公开的内容。</p>
        </section>
      )}
    </div>
  )
}
