import Link from 'next/link'

import { ContentCard } from './_components/ContentCard'
import { SiteHeader } from './_components/SiteHeader'
import { SurfaceIndex } from './_components/SurfaceIndex'
import { uiCopy } from './_lib/uiCopy'
import { listPublishedArticles, listPublishedProjects } from '@/lib/publicContent'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [articles, projects] = await Promise.all([listPublishedArticles(), listPublishedProjects()])
  const latestArticle = articles[0]
  const latestProject = projects[0]

  return (
    <div className="site-shell theme-dark site-shell--home">
      <SiteHeader />

      <main className="site-main">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero__copy">
            <p className="eyebrow">{uiCopy.home.hero.eyebrow}</p>
            <h1 id="home-title">{uiCopy.home.hero.title}</h1>
            <p className="summary">{uiCopy.home.hero.summary}</p>
            <div className="actions">
              {uiCopy.home.actions.map((action) => (
                <Link href={action.href} key={action.href}>
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          <aside className="hero-console" aria-label={uiCopy.home.statusLine.ariaLabel}>
            <div className="hero-console__bar">
              <span>{uiCopy.home.statusLine.barLabel}</span>
              <strong>{uiCopy.home.statusLine.phase}</strong>
            </div>
            <dl>
              <div>
                <dt>{uiCopy.home.statusLine.items.writing.label}</dt>
                <dd>
                  {articles.length} {uiCopy.home.statusLine.items.writing.valueSuffix}
                </dd>
              </div>
              <div>
                <dt>{uiCopy.home.statusLine.items.projects.label}</dt>
                <dd>
                  {projects.length} {uiCopy.home.statusLine.items.projects.valueSuffix}
                </dd>
              </div>
              <div>
                <dt>{uiCopy.home.statusLine.items.language.label}</dt>
                <dd>{uiCopy.home.statusLine.items.language.value}</dd>
              </div>
              <div>
                <dt>{uiCopy.home.statusLine.items.nextSurface.label}</dt>
                <dd>{uiCopy.home.statusLine.items.nextSurface.value}</dd>
              </div>
            </dl>
          </aside>
        </section>

        <section className="surface-index" aria-label={uiCopy.home.surfaceIndex.ariaLabel}>
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">{uiCopy.home.surfaceIndex.eyebrow}</p>
              <h2>{uiCopy.home.surfaceIndex.title}</h2>
            </div>
            <p>{uiCopy.home.surfaceIndex.body}</p>
          </div>
          <SurfaceIndex />
        </section>

        <section className="feature-grid feature-grid--asymmetric" aria-label="最新公开内容">
          {latestArticle ? (
            <ContentCard
              coverImage={latestArticle.coverImage}
              href={`/articles/${latestArticle.slug}`}
              label="最新写作"
              publishedAt={latestArticle.publishedAt}
              priorityImage
              summary={latestArticle.excerpt}
              title={latestArticle.title}
            />
          ) : (
            <div className="empty-panel">
              <p className="eyebrow">{uiCopy.home.emptyArticle.eyebrow}</p>
              <h2>{uiCopy.home.emptyArticle.title}</h2>
              <p>{uiCopy.home.emptyArticle.body}</p>
            </div>
          )}

          {latestProject ? (
            <ContentCard
              coverImage={latestProject.coverImage}
              href={`/projects/${latestProject.slug}`}
              label="最新项目"
              meta={latestProject.projectStatus}
              publishedAt={latestProject.publishedAt}
              priorityImage
              summary={latestProject.summary}
              title={latestProject.title}
            />
          ) : (
            <div className="empty-panel">
              <p className="eyebrow">{uiCopy.home.emptyProject.eyebrow}</p>
              <h2>{uiCopy.home.emptyProject.title}</h2>
              <p>{uiCopy.home.emptyProject.body}</p>
            </div>
          )}
        </section>

        <section className="about-preview" aria-labelledby="about-preview-title">
          <p className="eyebrow">{uiCopy.home.aboutPreview.eyebrow}</p>
          <h2 id="about-preview-title">{uiCopy.home.aboutPreview.title}</h2>
          <p>{uiCopy.home.aboutPreview.body}</p>
          <Link href="/about">{uiCopy.home.aboutPreview.linkLabel}</Link>
        </section>

        <section className="status-ledger" aria-label={uiCopy.home.statusLedgerAriaLabel}>
          <Link href="/articles">
            <span>写作</span>
            <strong>{articles.length} 篇已发布</strong>
          </Link>
          <Link href="/projects">
            <span>项目</span>
            <strong>{projects.length} 个已发布</strong>
          </Link>
          <Link href="/knowledge">
            <span>知识路径</span>
            <strong>预留入口已开放</strong>
          </Link>
          <Link href="/labs">
            <span>实验室</span>
            <strong>预留入口已开放</strong>
          </Link>
          <Link href="/about">
            <span>关于</span>
            <strong>平台说明已开放</strong>
          </Link>
        </section>
      </main>
    </div>
  )
}
