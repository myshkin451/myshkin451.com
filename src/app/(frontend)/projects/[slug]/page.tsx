import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CoverImage } from '../../_components/CoverImage'
import { RichTextView } from '../../_components/RichTextView'
import { SiteHeader } from '../../_components/SiteHeader'
import { SurfaceIndex } from '../../_components/SurfaceIndex'
import { formatProjectStatus, getProjectTechnologyNames } from '../../_lib/contentDisplay'
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
      title: '项目未找到 | Myshkin 451',
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

  const technologyNames = getProjectTechnologyNames(project)
  const statusLabel = formatProjectStatus(project.projectStatus)

  return (
    <div className="site-shell theme-dark site-shell--project-detail">
      <SiteHeader />

      <main className="project-main">
        <article className="project-entry">
          <header className="project-dossier-hero">
            <div className="project-dossier-hero__copy">
              <p className="eyebrow">项目卷宗 / Project Dossier</p>
              <h1>{project.title}</h1>
              <p>{project.summary}</p>
              <div className="entry-meta">
                <span>{statusLabel}</span>
                {project.publishedAt ? (
                  <time dateTime={project.publishedAt}>{formatDate(project.publishedAt)}</time>
                ) : null}
                <span>/projects/{project.slug}</span>
              </div>

              {project.links?.length ? (
                <nav className="link-list link-list--hero" aria-label="Project links">
                  {project.links.map((link) =>
                    link.label && link.url ? (
                      <a href={link.url} key={link.id ?? link.url} rel="noreferrer" target="_blank">
                        {link.label}
                      </a>
                    ) : null,
                  )}
                </nav>
              ) : null}
            </div>

            <dl className="dossier-facts dossier-facts--rail">
              <div>
                <dt>状态</dt>
                <dd>{statusLabel}</dd>
              </div>
              <div>
                <dt>发布时间</dt>
                <dd>{project.publishedAt ? formatDate(project.publishedAt) : '待定'}</dd>
              </div>
              <div>
                <dt>技术栈</dt>
                <dd>{technologyNames.join(' / ') || '待补充'}</dd>
              </div>
              <div>
                <dt>角色</dt>
                <dd>个人平台公开项目</dd>
              </div>
            </dl>
          </header>

          <CoverImage
            image={project.coverImage}
            priority
            sizes="(max-width: 980px) 100vw, 1120px"
          />

          {technologyNames.length ? (
            <ul className="tag-list" aria-label="Project technologies">
              {technologyNames.map((technology) => (
                <li key={technology}>{technology}</li>
              ))}
            </ul>
          ) : null}

          <section className="case-file" aria-label="项目正文">
            <aside className="case-file__rail">
              <p className="eyebrow">Case File</p>
              <p>正文保留 CMS 的自由写作能力，但页面外壳把状态、链接、技术和证据先固定下来。</p>
            </aside>
            <div className="case-file__body">
              <RichTextView content={project.content} />
            </div>
          </section>

          <footer className="entry-footer entry-footer--dark">
            <p>
              这个项目卷宗属于 Myshkin 451 的公开项目面，后续可以继续连接复盘文章、实验或知识路径。
            </p>
            <div className="actions actions--compact">
              <Link href="/projects">回到项目账本</Link>
              <Link href="/articles">查看写作档案</Link>
            </div>
          </footer>
        </article>

        <section className="surface-index surface-index--detail" aria-label="平台入口索引">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">Surface Index</p>
              <h2>项目之后，继续回到平台结构。</h2>
            </div>
            <p>项目记录可以继续向写作、知识路径和实验室延伸，而不是停在作品墙里。</p>
          </div>
          <SurfaceIndex compact />
        </section>
      </main>
    </div>
  )
}
