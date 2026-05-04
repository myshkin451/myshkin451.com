import { notFound } from 'next/navigation'

import { CoverImage } from '../../_components/CoverImage'
import { RichTextView } from '../../_components/RichTextView'
import { SiteHeader } from '../../_components/SiteHeader'
import { formatDate } from '@/lib/formatDate'
import { getPublishedProjectBySlug } from '@/lib/publicContent'
import { createPageMetadata } from '@/lib/siteMetadata'

export const dynamic = 'force-dynamic'

type ProjectPageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = await getPublishedProjectBySlug(slug)

  if (!project) {
    return {
      title: 'Project not found | Myshkin 451',
    }
  }

  return createPageMetadata({
    description: project.summary,
    image: project.coverImage,
    pathname: `/projects/${project.slug}`,
    title: project.title,
  })
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const project = await getPublishedProjectBySlug(slug)

  if (!project) {
    notFound()
  }

  return (
    <div className="site-shell">
      <SiteHeader />

      <main className="article-main">
        <article className="entry">
          <header className="entry-header">
            <p className="eyebrow">Project</p>
            <h1>{project.title}</h1>
            <p>{project.summary}</p>
            <div className="entry-meta">
              <span>{project.projectStatus}</span>
              {project.publishedAt ? (
                <time dateTime={project.publishedAt}>{formatDate(project.publishedAt)}</time>
              ) : null}
            </div>
          </header>

          <CoverImage image={project.coverImage} priority sizes="(max-width: 720px) 100vw, 860px" />

          {project.technologies?.length ? (
            <ul className="tag-list" aria-label="Project technologies">
              {project.technologies.map((technology) =>
                technology.name ? (
                  <li key={technology.id ?? technology.name}>{technology.name}</li>
                ) : null,
              )}
            </ul>
          ) : null}

          {project.links?.length ? (
            <nav className="link-list" aria-label="Project links">
              {project.links.map((link) =>
                link.label && link.url ? (
                  <a href={link.url} key={link.id ?? link.url} rel="noreferrer" target="_blank">
                    {link.label}
                  </a>
                ) : null,
              )}
            </nav>
          ) : null}

          <RichTextView content={project.content} />
        </article>
      </main>
    </div>
  )
}
