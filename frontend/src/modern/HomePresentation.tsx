import type { Entry, Settings } from '../types'
import { entryLabel, kindLabels } from '../types'
import { SiteLink } from '../navigation'
import { noteDate, noteExcerpt } from '../notes'
import { Icon } from '../ui'
import { CropPlayground } from '../study/CropPlayground'
import './modern-home.css'

const entryHref = (entry: Entry) => `#/entry/${encodeURIComponent(entry.id)}`

export function DisplayDate({ entry }: { entry: Entry }) {
  const date = noteDate(entry.publishedAt || entry.createdAt)
  return (
    <time dateTime={entry.publishedAt || entry.createdAt}>
      {Number(date.month)}月{Number(date.day)}日
    </time>
  )
}

function Meta({ entry, date = true }: { entry: Entry; date?: boolean }) {
  return (
    <div className="modern-meta">
      <span>{kindLabels[entry.kind]}</span>
      {entry.topics[0] && <span>{entry.topics[0]}</span>}
      {entry.sample && <span>样例</span>}
      {date && <DisplayDate entry={entry} />}
    </div>
  )
}

function EntryLine({ entry }: { entry: Entry }) {
  return (
    <SiteLink className="modern-entry-line" href={entryHref(entry)}>
      <Meta entry={entry} date={false} />
      <span>{entryLabel(entry)}</span>
      <Icon name="arrow" size={19} />
    </SiteLink>
  )
}

export function HomePresentation({
  entries,
  settings,
  onVisit,
}: {
  entries: Entry[]
  settings: Settings
  onVisit?: () => void
}) {
  const published = entries.filter((entry) => entry.status === 'published')
  const works = published
    .filter((entry) => entry.kind !== 'note')
    .sort(
      (a, b) =>
        Number(a.sample) - Number(b.sample) ||
        Number(b.featured) - Number(a.featured) ||
        b.publishedAt.localeCompare(a.publishedAt),
    )
  const lead = works[0]
  const rest = works.slice(1)
  const writing = rest.find((entry) => entry.kind === 'writing')
  const secondaryWriting = rest.find((entry) => entry.kind === 'writing' && entry !== writing)
  const photo = rest.find((entry) => entry.kind === 'photo')
  const shown = new Set([lead?.id, writing?.id, secondaryWriting?.id, photo?.id])
  const more = rest.filter((entry) => !shown.has(entry.id)).slice(0, 4)
  const notes = published
    .filter((entry) => entry.kind === 'note')
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3)
  const cover = lead?.cover || lead?.photos[0]?.src
  const crop = lead?.sample && lead.id === 'crop'
  const coverPhoto = photo?.photos[1] || photo?.photos[0]

  if (!published.length)
    return (
      <div className="modern-empty-home">
        <span className="modern-eyebrow">{settings.name}</span>
        <h1>作品与记录</h1>
        <p>{settings.intro || '文章、影像、项目，和日常的随记。'}</p>
        <div className="modern-empty-bottom">
          <span>还没有公开的内容。</span>
          <SiteLink className="modern-inline-link" href="#/about">
            关于这个网站
            <Icon name="arrow" />
          </SiteLink>
        </div>
        <nav className="modern-empty-nav" aria-label="浏览内容">
          {[
            ['文章', 'writing'],
            ['影像', 'photos'],
            ['项目', 'projects'],
            ['随记', 'notes'],
          ].map(([label, route]) => (
            <SiteLink key={route} href={`#/${route}`}>
              {label}
              <Icon name="arrow" />
            </SiteLink>
          ))}
        </nav>
      </div>
    )

  return (
    <div className="modern-home" onClick={onVisit}>
      <div className="modern-home-top">
        <h1>{lead?.featured ? '精选' : '最近发布'}</h1>
        <SiteLink href="#/archive" className="modern-inline-link">
          全部内容
          <Icon name="arrow" />
        </SiteLink>
      </div>
      {lead && (
        <article
          className={`modern-hero modern-hero-${lead.kind} ${crop ? 'modern-hero-interactive' : ''} ${!cover && !crop ? 'modern-hero-text' : ''}`}
        >
          <div className="modern-hero-copy">
            <div>
              <Meta entry={lead} date={false} />
              <h2>
                <SiteLink href={entryHref(lead)}>{entryLabel(lead)}</SiteLink>
              </h2>
              {lead.summary && <p>{lead.summary}</p>}
            </div>
            <SiteLink href={entryHref(lead)} className="modern-feature-link">
              <span>
                {lead.kind === 'project'
                  ? '打开项目'
                  : lead.kind === 'photo'
                    ? '查看组图'
                    : '阅读全文'}
              </span>
              <span className="modern-link-arrow">
                <Icon name={lead.kind === 'project' ? 'external' : 'arrow'} size={22} />
              </span>
            </SiteLink>
          </div>
          {crop ? (
            <CropPlayground compact />
          ) : cover ? (
            <SiteLink href={entryHref(lead)} className="modern-hero-image">
              <img src={cover} alt={lead.photos[0]?.alt || lead.title} fetchPriority="high" />
              {lead.photos[0]?.credit && <span>{lead.photos[0].credit}</span>}
            </SiteLink>
          ) : (
            <div className="modern-hero-excerpt">
              <DisplayDate entry={lead} />
              <p>{noteExcerpt((lead.body || lead.summary).replace(/^## /gm, ''), 180)}</p>
            </div>
          )}
        </article>
      )}
      {(writing || photo) && (
        <section
          className={`modern-composition ${!writing || !photo ? 'modern-composition-single' : ''}`}
          aria-label="文章与影像"
        >
          {writing && (
            <div className="modern-writing-column">
              <article className="modern-writing-feature">
                <Meta entry={writing} />
                <SiteLink href={entryHref(writing)}>
                  <h2>{writing.title}</h2>
                  {writing.summary && <p>{writing.summary}</p>}
                  <span className="modern-inline-link">
                    阅读全文
                    <Icon name="arrow" />
                  </span>
                </SiteLink>
              </article>
              {secondaryWriting && <EntryLine entry={secondaryWriting} />}
            </div>
          )}
          {photo && (
            <article className="modern-photo-feature">
              <SiteLink
                className="modern-photo-link"
                href={entryHref(photo)}
                aria-label={`查看${photo.title}组图`}
              >
                <div className="modern-photo-frame">
                  <img
                    src={coverPhoto?.src || photo.cover}
                    alt={coverPhoto?.alt || photo.title}
                    loading="lazy"
                  />
                  <span className="modern-photo-open">
                    <Icon name="external" size={22} />
                  </span>
                </div>
                <div className="modern-photo-caption">
                  <div>
                    <Meta entry={photo} date={false} />
                    <h2>{photo.title}</h2>
                  </div>
                  <span>
                    {photo.photos.length} 张图像
                    <Icon name="arrow" />
                  </span>
                </div>
              </SiteLink>
              {coverPhoto?.credit && <p className="modern-image-credit">{coverPhoto.credit}</p>}
            </article>
          )}
        </section>
      )}
      {more.length > 0 && (
        <section className="modern-more" aria-label="更多内容">
          {more.map((entry) => (
            <EntryLine key={entry.id} entry={entry} />
          ))}
        </section>
      )}
      {notes.length > 0 && (
        <section className={`modern-notes-preview ${!lead ? 'modern-notes-only' : ''}`}>
          <div className="modern-section-heading">
            <h2>最近的随记</h2>
            <SiteLink className="modern-inline-link" href="#/notes">
              查看全部
              <Icon name="arrow" />
            </SiteLink>
          </div>
          <div>
            {notes.map((entry) => (
              <SiteLink className="modern-note-row" key={entry.id} href={entryHref(entry)}>
                <DisplayDate entry={entry} />
                <p>{noteExcerpt(entry.body, 160)}</p>
                <Icon name="arrow" />
              </SiteLink>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
