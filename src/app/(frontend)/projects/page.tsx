import { ContentCard } from '../_components/ContentCard'
import { SiteHeader } from '../_components/SiteHeader'
import { listPublishedProjects } from '@/lib/publicContent'
import { createPageMetadata } from '@/lib/siteMetadata'

export const dynamic = 'force-dynamic'

export const metadata = createPageMetadata({
  pathname: '/projects',
  description: 'Myshkin 451 的公开项目、系统、实验记录和复盘。',
  title: '项目',
})

export default async function ProjectsPage() {
  const projects = await listPublishedProjects()

  return (
    <div className="site-shell">
      <SiteHeader />

      <main className="site-main">
        <section className="page-heading">
          <p className="eyebrow">项目 / Projects</p>
          <h1>值得被公开检查的作品、实验和系统。</h1>
          <p>这里保存完成的作品、还在生长的工具、技术实验、复盘，以及把它们连接起来的上下文。</p>
        </section>

        <section className="content-list" aria-label="已发布项目">
          {projects.length > 0 ? (
            projects.map((project) => (
              <ContentCard
                coverImage={project.coverImage}
                href={`/projects/${project.slug}`}
                key={project.id}
                label="项目"
                meta={project.projectStatus}
                publishedAt={project.publishedAt}
                summary={project.summary}
                title={project.title}
              />
            ))
          ) : (
            <div className="empty-panel">
              <h2>还没有公开项目。</h2>
              <p>第一批通过 CMS 发布的项目记录会出现在这里。</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
