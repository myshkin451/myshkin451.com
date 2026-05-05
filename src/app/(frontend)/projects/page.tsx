import Link from 'next/link'

import { CoverImage } from '../_components/CoverImage'
import { SiteFooter } from '../_components/SiteFooter'
import { SiteHeader } from '../_components/SiteHeader'
import { SurfaceIndex } from '../_components/SurfaceIndex'
import {
  formatProjectStatus,
  getProjectTechnologyNames,
  getPublicationYear,
} from '../_lib/contentDisplay'
import { formatDate } from '@/lib/formatDate'
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
  const featuredProject = projects[0]

  return (
    <div className="site-shell theme-dark site-shell--projects">
      <SiteHeader />

      <main className="site-main project-main">
        <section className="archive-hero project-hero" aria-labelledby="projects-title">
          <div className="page-heading page-heading--wide">
            <p className="eyebrow">项目卷宗 / Project Dossiers</p>
            <h1 id="projects-title">把作品放成可以检查的案例档案。</h1>
            <p>
              这里保存完成的作品、还在生长的工具、技术实验、复盘，以及把它们连接起来的上下文。
              项目页比作品墙更像公共卷宗：状态、技术、链接和证据要能被快速扫描。
            </p>
          </div>

          <aside className="archive-status archive-status--dark" aria-label="项目状态">
            <dl>
              <div>
                <dt>已发布</dt>
                <dd>{projects.length} 个</dd>
              </div>
              <div>
                <dt>最新年份</dt>
                <dd>
                  {featuredProject ? getPublicationYear(featuredProject.publishedAt) : '待发布'}
                </dd>
              </div>
              <div>
                <dt>展示方式</dt>
                <dd>证据优先，项目卷宗</dd>
              </div>
            </dl>
          </aside>
        </section>

        {featuredProject ? (
          <section className="project-dossier project-dossier--featured" aria-label="精选项目">
            <div className="project-dossier__body">
              <p className="eyebrow">Featured Dossier</p>
              <h2>
                <Link href={`/projects/${featuredProject.slug}`}>{featuredProject.title}</Link>
              </h2>
              <p>{featuredProject.summary}</p>
              <dl className="dossier-facts dossier-facts--inline">
                <div>
                  <dt>状态</dt>
                  <dd>{formatProjectStatus(featuredProject.projectStatus)}</dd>
                </div>
                <div>
                  <dt>发布时间</dt>
                  <dd>
                    {featuredProject.publishedAt ? formatDate(featuredProject.publishedAt) : '待定'}
                  </dd>
                </div>
                <div>
                  <dt>技术线索</dt>
                  <dd>{getProjectTechnologyNames(featuredProject).join(' / ') || '待补充'}</dd>
                </div>
              </dl>
              <Link className="inline-link" href={`/projects/${featuredProject.slug}`}>
                打开项目卷宗
              </Link>
            </div>
            <CoverImage
              image={featuredProject.coverImage}
              priority
              sizes="(max-width: 880px) 100vw, 430px"
            />
          </section>
        ) : null}

        <section className="project-ledger" aria-label="项目档案">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">Dossier Ledger</p>
              <h2>每个项目都应该留下可检查的上下文。</h2>
            </div>
            <p>当前先用 CMS 里已有的状态、摘要、技术和链接字段，形成足够清楚的公开项目账本。</p>
          </div>

          {projects.length > 0 ? (
            <ol className="dossier-list">
              {projects.map((project, index) => {
                const technologies = getProjectTechnologyNames(project)

                return (
                  <li className="dossier-row" key={project.id}>
                    <span className="dossier-row__marker">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="dossier-row__body">
                      <Link
                        aria-label={project.title}
                        className="dossier-row__title"
                        href={`/projects/${project.slug}`}
                      >
                        {project.title}
                      </Link>
                      <p>{project.summary}</p>
                      {technologies.length ? (
                        <ul className="tag-list tag-list--compact" aria-label="项目技术">
                          {technologies.slice(0, 5).map((technology) => (
                            <li key={technology}>{technology}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <p className="dossier-row__meta">
                      <span>{formatProjectStatus(project.projectStatus)}</span>
                      {project.publishedAt ? (
                        <time dateTime={project.publishedAt}>
                          {formatDate(project.publishedAt)}
                        </time>
                      ) : (
                        <span>待定</span>
                      )}
                    </p>
                  </li>
                )
              })}
            </ol>
          ) : (
            <div className="empty-panel">
              <h2>还没有公开项目。</h2>
              <p>第一批通过 CMS 发布的项目记录会出现在这里。</p>
            </div>
          )}
        </section>

        <section className="surface-index surface-index--detail" aria-label="平台入口索引">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">Surface Index</p>
              <h2>项目卷宗会继续连接写作和实验。</h2>
            </div>
            <p>项目不只是展示结果，也会逐渐连接复盘文章、知识路径和实验室里的工具。</p>
          </div>
          <SurfaceIndex compact />
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
