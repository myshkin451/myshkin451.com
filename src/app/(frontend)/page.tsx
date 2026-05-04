import Link from 'next/link'

import { ContentCard } from './_components/ContentCard'
import { SiteHeader } from './_components/SiteHeader'
import { SurfaceIndex } from './_components/SurfaceIndex'
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
            <p className="eyebrow">中文优先的技术图谱 / Public Workshop</p>
            <h1 id="home-title">把写作、项目和知识路径放回同一个工作台。</h1>
            <p className="summary">
              {
                'Myshkin 451 是一个长期生长的个人数字平台：这里会放中文长文、公开项目、研究路径和小型实验，让思考与建造互相留下证据。'
              }
            </p>
            <div className="actions">
              <Link href="/articles">进入写作</Link>
              <Link href="/projects">查看项目</Link>
              <Link href="/about">了解这个平台</Link>
            </div>
          </div>

          <aside className="hero-console" aria-label="平台状态">
            <div className="hero-console__bar">
              <span>STATUS LINE</span>
              <strong>Phase 2 / Public Site</strong>
            </div>
            <dl>
              <div>
                <dt>写作</dt>
                <dd>{articles.length} 篇已发布</dd>
              </div>
              <div>
                <dt>项目</dt>
                <dd>{projects.length} 个已发布</dd>
              </div>
              <div>
                <dt>语言</dt>
                <dd>中文优先，保留英文路径</dd>
              </div>
              <div>
                <dt>下一个面</dt>
                <dd>知识路径与实验室预留</dd>
              </div>
            </dl>
          </aside>
        </section>

        <section className="surface-index" aria-label="平台四个入口">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">Surface Index</p>
              <h2>四个入口，不是四个孤岛。</h2>
            </div>
            <p>
              首页先把平台结构说清楚：可阅读的文字、可检查的项目、将来可串联的知识路径，以及有边界的实验。
            </p>
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
              <p className="eyebrow">写作</p>
              <h2>还没有公开文章。</h2>
              <p>内容模型已经准备好；第一批通过 CMS 发布的中文长文会出现在这里。</p>
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
              <p className="eyebrow">项目</p>
              <h2>还没有公开项目。</h2>
              <p>通过 Payload 发布的作品记录会在这里成为可检查的案例面板。</p>
            </div>
          )}
        </section>

        <section className="about-preview" aria-labelledby="about-preview-title">
          <p className="eyebrow">About</p>
          <h2 id="about-preview-title">这个平台由一个持续学习、写作和造工具的人维护。</h2>
          <p>
            {
              '它不是简历页，也不是把旧博客换一层皮。Myshkin 451 会把公开表达、项目证据和长期知识整理放在同一个系统里，允许它们互相引用、互相修正。'
            }
          </p>
          <Link href="/about">阅读关于页面</Link>
        </section>

        <section className="status-ledger" aria-label="平台入口状态">
          <Link href="/articles">
            <span>写作</span>
            <strong>{articles.length} 篇已发布</strong>
          </Link>
          <Link href="/projects">
            <span>项目</span>
            <strong>{projects.length} 个已发布</strong>
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
