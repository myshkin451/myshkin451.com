import { SiteLink } from './navigation'
import { useEffect, useRef } from 'react'
import type { Entry, Photo } from './types'
import { entryLabel, formatDate, kindLabels, safeDestination } from './types'
import { noteDate, noteExcerpt } from './notes'

export function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    external: (
      <>
        <path d="M6 18 18 6M6 6h12v12" />
      </>
    ),
    back: (
      <>
        <path d="M19 12H5m6 6-6-6 6-6" />
      </>
    ),
    close: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    grid: (
      <>
        <rect x="4" y="4" width="6" height="6" rx=".5" />
        <rect x="14" y="4" width="6" height="6" rx=".5" />
        <rect x="4" y="14" width="6" height="6" rx=".5" />
        <rect x="14" y="14" width="6" height="6" rx=".5" />
      </>
    ),
    list: (
      <>
        <path d="M8 5h12M8 12h12M8 19h12M4 5h.1M4 12h.1M4 19h.1" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.arrow}
    </svg>
  )
}

export function EntryArtwork({ entry, small = false }: { entry: Entry; small?: boolean }) {
  if (entry.cover || entry.photos[0])
    return (
      <div className={`entry-art photo-art ${small ? 'small' : ''}`}>
        <img
          src={entry.cover || entry.photos[0].src}
          alt={entry.photos[0]?.alt || entry.title}
          loading="lazy"
        />
        {entry.kind === 'photo' && (
          <span className="media-count">
            {String(entry.photos.length || 1).padStart(2, '0')}
            <Icon name="grid" size={12} />
          </span>
        )}
      </div>
    )
  if (entry.artwork === 'color')
    return (
      <div className={`entry-art color-art ${small ? 'small' : ''}`} aria-hidden="true">
        <div className="color-art-disc" />
        <div className="color-art-bottom">
          <span>01 — 02</span>
          <span>色彩练习</span>
        </div>
      </div>
    )
  if (entry.artwork === 'site')
    return (
      <div className={`entry-art site-art ${small ? 'small' : ''}`} aria-hidden="true">
        <div className="site-art-page">
          <div className="mini-header">Myshkin 451</div>
          <div className="mini-title">内容</div>
          <div className="mini-columns">
            <div />
            <div />
            <div />
          </div>
          <div className="mini-lines">
            <i />
            <i />
          </div>
        </div>
      </div>
    )
  return (
    <div className={`entry-art text-art ${small ? 'small' : ''}`} aria-hidden="true">
      <span className="text-art-topic">{entry.topics[0] || kindLabels[entry.kind]}</span>
      <div>{entry.title || '未命名'}</div>
      <span className="text-art-bottom">
        {entry.sample ? '排版样文' : kindLabels[entry.kind]}
        <Icon name="arrow" />
      </span>
    </div>
  )
}

export function primaryHref(entry: Entry) {
  return entry.kind === 'project' && safeDestination(entry.destination)
    ? safeDestination(entry.destination)
    : `#/entry/${encodeURIComponent(entry.id)}`
}
export function EntryCard({ entry, index = 0 }: { entry: Entry; index?: number }) {
  const href = primaryHref(entry)
  const external = /^https?:/.test(href)
  if (entry.kind === 'note')
    return (
      <article className="entry-card entry-card-note">
        <div className="card-meta">
          <span>随记{entry.sample ? ' · 样例' : ''}</span>
          <time dateTime={entry.publishedAt}>{formatDate(entry.publishedAt)}</time>
        </div>
        <SiteLink className="note-card-text" href={href}>
          {entry.body}
        </SiteLink>
        <SiteLink className="text-link" href={href} aria-label={entryLabel(entry)}>
          阅读全文 <Icon name="arrow" size={14} />
        </SiteLink>
      </article>
    )
  return (
    <article
      className={`entry-card entry-card-${entry.kind}`}
      style={{ '--order': index } as React.CSSProperties}
    >
      {(entry.kind !== 'writing' || entry.cover) && (
        <SiteLink
          className="art-link"
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer' : undefined}
          aria-label={`${entry.title}${external ? '（在新标签页打开）' : ''}`}
        >
          <EntryArtwork entry={entry} />
        </SiteLink>
      )}
      <div className="card-meta">
        <span>
          {kindLabels[entry.kind]}
          {entry.sample ? ' · 样例' : ''}
        </span>
        {entry.topics[0] && (
          <SiteLink href={`#/topics/${encodeURIComponent(entry.topics[0])}`}>
            {entry.topics[0]}
          </SiteLink>
        )}
      </div>
      <div className="card-title-row">
        <h2>
          <SiteLink
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
          >
            {entry.title}
          </SiteLink>
        </h2>
        <Icon name={external ? 'external' : 'arrow'} size={17} />
      </div>
      {entry.summary && <p className="card-summary">{entry.summary}</p>}
      {entry.kind === 'project' && (
        <SiteLink className="project-details" href={`#/entry/${entry.id}`}>
          项目说明
        </SiteLink>
      )}
    </article>
  )
}

/**
 * A dated ledger. Every kind of work keeps its own shape: notes show their text,
 * photos keep their proportions, writing leads with its title, projects show a way in.
 */
export function Stream({
  entries,
  children,
  label,
}: {
  entries: Entry[]
  children?: React.ReactNode
  label?: string
}) {
  const years = entries.map((entry) => noteDate(entry.publishedAt || entry.createdAt).year)
  return (
    <ol className="stream" aria-label={label}>
      {entries.map((entry, index) => (
        <StreamRow key={entry.id} entry={entry} showYear={years[index] !== years[index - 1]} />
      ))}
      {children}
    </ol>
  )
}

function Topics({ entry, base = '#/topics/' }: { entry: Entry; base?: string }) {
  if (!entry.topics.length) return null
  return (
    <span className="stream-topics">
      {entry.topics.map((topic) => (
        <SiteLink key={topic} href={`${base}${encodeURIComponent(topic)}`}>
          {topic}
        </SiteLink>
      ))}
    </span>
  )
}

export function StreamRow({ entry, showYear = true }: { entry: Entry; showYear?: boolean }) {
  const href = primaryHref(entry)
  const external = /^https?:/.test(href)
  const stamp = noteDate(entry.publishedAt || entry.createdAt)
  const detail = `#/entry/${encodeURIComponent(entry.id)}`
  const linkProps = external ? { target: '_blank', rel: 'noreferrer' } : {}
  const label = entryLabel(entry)
  const image = entry.cover || entry.photos[0]?.src
  return (
    <li className={`stream-row stream-row-${entry.kind}${entry.featured ? ' is-featured' : ''}`}>
      <div className="stamp">
        <SiteLink
          href={detail}
          aria-label={`${label}，${stamp.year}年${stamp.month}月${stamp.day}日`}
        >
          <time dateTime={entry.publishedAt || entry.createdAt} className="stamp-date">
            {stamp.month}.{stamp.day}
          </time>
          <span className={`stamp-year${showYear ? '' : ' is-repeat'}`}>{stamp.year}</span>
        </SiteLink>
        <span className="stamp-kind">
          {entry.featured && <i className="stamp-mark" aria-label="精选" />}
          {kindLabels[entry.kind]}
          {entry.sample && <small>样例</small>}
        </span>
      </div>
      <div className="stream-body">
        {entry.kind === 'note' && (
          <>
            <SiteLink className="stream-note" href={href}>
              {noteExcerpt(entry.body, 220)}
            </SiteLink>
            <div className="stream-meta">
              <Topics entry={entry} base="#/notes?topic=" />
            </div>
          </>
        )}
        {entry.kind === 'photo' && (
          <>
            {image && (
              <SiteLink className="stream-figure" href={href} aria-label={`查看「${label}」`}>
                <img src={image} alt={entry.photos[0]?.alt || label} loading="lazy" />
              </SiteLink>
            )}
            <h2 className="stream-title">
              <SiteLink href={href}>{label}</SiteLink>
            </h2>
            {entry.summary && <p className="stream-summary">{entry.summary}</p>}
            <div className="stream-meta">
              <span className="stream-count">
                {String(entry.photos.length || 1).padStart(2, '0')} 张
              </span>
              <Topics entry={entry} />
            </div>
          </>
        )}
        {entry.kind === 'writing' && (
          <>
            <h2 className="stream-title">
              <SiteLink href={href}>{label}</SiteLink>
            </h2>
            {entry.summary && <p className="stream-summary">{entry.summary}</p>}
            {entry.cover && (
              <SiteLink
                className="stream-figure is-inline"
                href={href}
                aria-hidden="true"
                tabIndex={-1}
              >
                <img src={entry.cover} alt="" loading="lazy" />
              </SiteLink>
            )}
            <div className="stream-meta">
              <SiteLink className="stream-action" href={href}>
                阅读
                <Icon name="arrow" size={14} />
              </SiteLink>
              <Topics entry={entry} />
            </div>
          </>
        )}
        {entry.kind === 'project' && (
          <>
            <h2 className="stream-title">
              <SiteLink href={href} {...linkProps}>
                {label}
                {external && <Icon name="external" size={16} />}
              </SiteLink>
            </h2>
            {entry.summary && <p className="stream-summary">{entry.summary}</p>}
            <SiteLink
              className="stream-figure is-project"
              href={href}
              {...linkProps}
              aria-hidden="true"
              tabIndex={-1}
            >
              <EntryArtwork entry={entry} />
            </SiteLink>
            <div className="stream-meta">
              <SiteLink className="stream-action" href={href} {...linkProps}>
                {href !== detail ? (href.startsWith('#/') ? '打开体验' : '访问项目') : '查看项目'}
                <Icon name={external ? 'external' : 'arrow'} size={14} />
              </SiteLink>
              {href !== detail && <SiteLink href={detail}>项目说明</SiteLink>}
              <Topics entry={entry} />
            </div>
          </>
        )}
      </div>
    </li>
  )
}

export function TextBody({ text }: { text: string }) {
  let heading = 0
  return (
    <div className="text-body">
      {text
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((block, i) => {
          if (block.startsWith('## '))
            return (
              <h2 id={`section-${heading++}`} key={i}>
                {block.slice(3)}
              </h2>
            )
          if (block.startsWith('> '))
            return <blockquote key={i}>{block.replace(/^> ?/gm, '')}</blockquote>
          if (block.startsWith('```'))
            return (
              <pre key={i}>
                <code>{block.replace(/^```[^\n]*\n?|\n?```$/g, '')}</code>
              </pre>
            )
          if (block.startsWith('- '))
            return (
              <ul key={i}>
                {block.split('\n').map((line, j) => (
                  <li key={j}>{line.replace(/^- /, '')}</li>
                ))}
              </ul>
            )
          return <p key={i}>{block}</p>
        })}
    </div>
  )
}

export function PhotoViewer({
  photos,
  index,
  onIndex,
  onClose,
}: {
  photos: Photo[]
  index: number
  onIndex: (index: number) => void
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const photo = photos[index]
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const el = dialog.current
    el?.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      el?.close()
      document.body.style.overflow = previousOverflow
      previous?.focus()
    }
  }, [])
  if (!photo) return null
  return (
    <dialog
      ref={dialog}
      className="photo-viewer"
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') onIndex((index + 1) % photos.length)
        if (e.key === 'ArrowLeft') onIndex((index - 1 + photos.length) % photos.length)
      }}
      aria-label="图像查看器"
    >
      <div className="viewer-top">
        <span>
          {String(index + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
        </span>
        <button className="icon-button" onClick={onClose} aria-label="关闭大图">
          <Icon name="close" size={24} />
        </button>
      </div>
      <div className="viewer-image">
        <img key={photo.id} src={photo.src} alt={photo.alt || photo.caption || '图像'} />
      </div>
      <div className="viewer-bottom">
        <div>
          {photo.caption}
          <span className="viewer-credit">{photo.credit}</span>
        </div>
        <div className="viewer-controls">
          <button
            className="icon-button"
            disabled={photos.length < 2}
            onClick={() => onIndex((index - 1 + photos.length) % photos.length)}
            aria-label="上一张"
          >
            <Icon name="back" />
          </button>
          <button
            className="icon-button"
            disabled={photos.length < 2}
            onClick={() => onIndex((index + 1) % photos.length)}
            aria-label="下一张"
          >
            <Icon name="arrow" />
          </button>
        </div>
      </div>
    </dialog>
  )
}
