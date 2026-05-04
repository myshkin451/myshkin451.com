import { ContentCard } from '../_components/ContentCard'
import { SiteHeader } from '../_components/SiteHeader'
import { listPublishedProjects } from '@/lib/publicContent'
import { createPageMetadata } from '@/lib/siteMetadata'

export const dynamic = 'force-dynamic'

export const metadata = createPageMetadata({
  pathname: '/projects',
  description: 'Projects and platform artifacts from Myshkin 451.',
  title: 'Projects',
})

export default async function ProjectsPage() {
  const projects = await listPublishedProjects()

  return (
    <div className="site-shell">
      <SiteHeader />

      <main className="site-main">
        <section className="page-heading">
          <p className="eyebrow">Projects</p>
          <h1>Artifacts, experiments, and systems worth keeping visible.</h1>
          <p>
            A place for finished work, living tools, technical experiments, retrospectives, and the
            connective tissue behind them.
          </p>
        </section>

        <section className="content-list" aria-label="Published projects">
          {projects.length > 0 ? (
            projects.map((project) => (
              <ContentCard
                coverImage={project.coverImage}
                href={`/projects/${project.slug}`}
                key={project.id}
                label="Project"
                meta={project.projectStatus}
                publishedAt={project.publishedAt}
                summary={project.summary}
                title={project.title}
              />
            ))
          ) : (
            <div className="empty-panel">
              <h2>No public projects yet.</h2>
              <p>Published project records will appear here after the first CMS publishing pass.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
