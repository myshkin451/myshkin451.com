import { usePlatform } from '../platform'
import { HomePresentation } from '../modern/HomePresentation'
import { SiteLink } from '../navigation'
import { Icon } from '../ui'

export function Home({ onVisit }: { onVisit: () => void }) {
  const { state, entries, drafts, isOwner, remote } = usePlatform()
  return (
    <>
      {(!remote || isOwner) && (
        <nav className="home-owner-actions" aria-label="我的创作">
          <SiteLink className="home-write-note" href="#/studio/notes">
            <Icon name="plus" size={18} /> 写随记
          </SiteLink>
          <SiteLink href="#/studio/new?kind=writing">写文章</SiteLink>
          <SiteLink href="#/studio">
            工作台{drafts.length > 0 ? ` · ${drafts.length} 份草稿` : ''}
          </SiteLink>
          <a
            className="home-study-link"
            href={remote ? '/study' : 'https://myshkin451.vercel.app/study'}
          >
            进入学习 <Icon name="arrow" size={16} />
          </a>
        </nav>
      )}
      <HomePresentation entries={entries} settings={state.settings} onVisit={onVisit} />
    </>
  )
}
