import { SiteLink } from '../navigation'
import { usePlatform } from '../platform'
import { EntryCard, Icon } from '../ui'
import type { EntryKind } from '../types'
import { LatestNote } from './Notes'
import './home.css'

const destinations: { kind: EntryKind; label: string; href: string }[] = [
  { kind: 'note', label: '随记', href: '#/notes' },
  { kind: 'writing', label: '文章', href: '#/writing' },
  { kind: 'photo', label: '影像', href: '#/photos' },
  { kind: 'project', label: '项目', href: '#/projects' },
]

export function Home({ onVisit }: { onVisit: () => void }) {
  const { state, entries } = usePlatform()
  const published = entries.filter((entry) => entry.status === 'published')
  const works = published.filter((entry) => entry.kind !== 'note')
  const featured = works.filter((entry) => entry.featured)
  const recent = [...(featured.length ? featured : works)]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3)

  return (
    <div className={`home ${published.length ? 'home-populated' : 'home-empty'}`}>
      <section className="home-front" aria-labelledby="home-heading">
        <div className="home-welcome">
          <h1 id="home-heading">欢迎来访。</h1>
          {state.settings.intro && <p>{state.settings.intro}</p>}
          <SiteLink className="home-message" href="#/guestbook">
            给我留言
            <Icon name="arrow" size={17} />
          </SiteLink>
          <LatestNote />
        </div>
        <div className="home-directory">
          <nav aria-label="浏览内容">
            {destinations.map(({ kind, label, href }) => {
              const count = published.filter((entry) => entry.kind === kind).length
              return (
                <SiteLink key={kind} href={href} className="home-destination">
                  <span className="home-destination-name">{label}</span>
                  {count > 0 && <span className="home-destination-count">{count}</span>}
                  <Icon name="arrow" size={25} />
                </SiteLink>
              )
            })}
          </nav>
          <div className="home-directory-foot">
            <span>
              {published.length
                ? published.every((entry) => entry.sample)
                  ? '正在展示样例'
                  : `${published.length} 项公开内容`
                : '暂无公开内容'}
            </span>
            {published.length > 0 && (
              <SiteLink href="#/archive">
                全部内容
                <Icon name="arrow" size={14} />
              </SiteLink>
            )}
          </div>
        </div>
      </section>
      {recent.length > 0 && (
        <section className="home-recent" aria-labelledby="home-recent-heading" onClick={onVisit}>
          <div className="home-section-heading">
            <h2 id="home-recent-heading">
              {recent.some((entry) => entry.featured) ? '精选' : '最近更新'}
            </h2>
            <SiteLink href="#/archive">
              查看全部
              <Icon name="arrow" size={14} />
            </SiteLink>
          </div>
          <div className={`home-recent-grid home-recent-${recent.length}`}>
            {recent.map((entry, index) => (
              <EntryCard key={entry.id} entry={entry} index={index} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
