import Link from 'next/link'

import './styles.css'
import { ContentCard } from './_components/ContentCard'
import { SiteHeader } from './_components/SiteHeader'
import { listPublishedArticles, listPublishedProjects } from '@/lib/publicContent'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [articles, projects] = await Promise.all([listPublishedArticles(), listPublishedProjects()])
  const latestArticle = articles[0]
  const latestProject = projects[0]

  return (
    <div className="site-shell">
      <SiteHeader />

      <main className="site-main">
        <section className="intro">
          <p className="eyebrow">Personal digital platform</p>
          <h1>Writing, projects, knowledge, and experiments under one roof.</h1>
          <p className="summary">
            Myshkin 451 is becoming a public working archive: essays, project records, research
            paths, and small tools that can keep growing without being rebuilt from scratch.
          </p>
          <div className="actions">
            <Link href="/articles">Read writing</Link>
            <Link href="/projects">Browse projects</Link>
          </div>
        </section>

        <section className="platform-map" aria-label="Platform areas">
          <div className="section-heading">
            <p className="eyebrow">Public structure</p>
            <h2>Four surfaces, one working archive.</h2>
          </div>
          <div className="platform-map__grid">
            <Link className="platform-map__item" href="/articles">
              <span>Writing</span>
              <strong>Essays, notes, and longer arguments.</strong>
            </Link>
            <Link className="platform-map__item" href="/projects">
              <span>Projects</span>
              <strong>Artifacts, systems, demos, and retrospectives.</strong>
            </Link>
            <div className="platform-map__item platform-map__item--reserved">
              <span>Knowledge paths</span>
              <strong>Curated routes through research and study notes.</strong>
            </div>
            <div className="platform-map__item platform-map__item--reserved">
              <span>Labs</span>
              <strong>Small tools and experiments without crowding the core.</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid" aria-label="Latest public entries">
          {latestArticle ? (
            <ContentCard
              coverImage={latestArticle.coverImage}
              href={`/articles/${latestArticle.slug}`}
              label="Latest writing"
              publishedAt={latestArticle.publishedAt}
              priorityImage
              summary={latestArticle.excerpt}
              title={latestArticle.title}
            />
          ) : (
            <div className="empty-panel">
              <p className="eyebrow">Writing</p>
              <h2>No public articles yet.</h2>
              <p>
                The collection is ready; published essays will appear here after the first CMS run.
              </p>
            </div>
          )}

          {latestProject ? (
            <ContentCard
              coverImage={latestProject.coverImage}
              href={`/projects/${latestProject.slug}`}
              label="Latest project"
              meta={latestProject.projectStatus}
              publishedAt={latestProject.publishedAt}
              priorityImage
              summary={latestProject.summary}
              title={latestProject.title}
            />
          ) : (
            <div className="empty-panel">
              <p className="eyebrow">Projects</p>
              <h2>No public projects yet.</h2>
              <p>Project records will appear here once they are published from Payload.</p>
            </div>
          )}
        </section>

        <section className="status" aria-label="Platform status">
          <Link href="/articles">
            <span>Writing</span>
            <strong>{articles.length} published</strong>
          </Link>
          <Link href="/projects">
            <span>Projects</span>
            <strong>{projects.length} published</strong>
          </Link>
          <Link href="/admin">
            <span>Admin</span>
            <strong>Payload CMS</strong>
          </Link>
        </section>
      </main>
    </div>
  )
}
