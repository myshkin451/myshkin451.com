import Link from 'next/link'

import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { SurfaceIndex } from './SurfaceIndex'

type ReservedSurfaceFact = {
  label: string
  value: string
}

type ReservedSurfaceLink = {
  href: string
  label: string
}

type ReservedSurfaceStep = {
  body: string
  marker: string
  title: string
}

type ReservedSurfacePageProps = {
  board: {
    body: string
    eyebrow: string
    title: string
  }
  facts: readonly ReservedSurfaceFact[]
  hero: {
    eyebrow: string
    summary: string
    title: string
  }
  links: readonly ReservedSurfaceLink[]
  note: {
    body: string
    eyebrow: string
    title: string
  }
  statusAriaLabel: string
  steps: readonly ReservedSurfaceStep[]
  surfaceId: 'knowledge' | 'labs'
  theme: 'dark' | 'light'
}

export function ReservedSurfacePage({
  board,
  facts,
  hero,
  links,
  note,
  statusAriaLabel,
  steps,
  surfaceId,
  theme,
}: ReservedSurfacePageProps) {
  const titleId = `${surfaceId}-title`
  const boardId = `${surfaceId}-board-title`

  return (
    <div className={`site-shell theme-${theme} site-shell--reserved site-shell--${surfaceId}`}>
      <SiteHeader />

      <main className="site-main reserved-main">
        <section className="reserved-hero" aria-labelledby={titleId}>
          <div className="page-heading page-heading--wide">
            <p className="eyebrow">{hero.eyebrow}</p>
            <h1 id={titleId}>{hero.title}</h1>
            <p>{hero.summary}</p>
          </div>

          <aside className="reserved-status" aria-label={statusAriaLabel}>
            <dl>
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.label}</dt>
                  <dd>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </section>

        <section className="reserved-board" aria-labelledby={boardId}>
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">{board.eyebrow}</p>
              <h2 id={boardId}>{board.title}</h2>
            </div>
            <p>{board.body}</p>
          </div>

          <ol className="reserved-step-list">
            {steps.map((step) => (
              <li key={step.marker}>
                <span>{step.marker}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="reserved-note" aria-label={note.eyebrow}>
          <div>
            <p className="eyebrow">{note.eyebrow}</p>
            <h2>{note.title}</h2>
            <p>{note.body}</p>
          </div>
          <div className="actions actions--compact">
            {links.map((link) => (
              <Link href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="surface-index surface-index--detail" aria-label="平台入口索引">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">Surface Index</p>
              <h2>预留入口仍然属于同一个平台。</h2>
            </div>
            <p>它们现在先承担导航、边界说明和未来结构提示；等真实内容足够后再扩展模型。</p>
          </div>
          <SurfaceIndex compact />
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
