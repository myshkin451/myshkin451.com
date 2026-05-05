import Link from 'next/link'

import { CoverImage } from '../_components/CoverImage'
import { SiteFooter } from '../_components/SiteFooter'
import { SiteHeader } from '../_components/SiteHeader'
import { SurfaceIndex } from '../_components/SurfaceIndex'
import {
  getReadingMinutes,
  groupByPublicationYear,
  getPublicationYear,
} from '../_lib/contentDisplay'
import { formatDate } from '@/lib/formatDate'
import { listPublishedArticles } from '@/lib/publicContent'
import { createPageMetadata } from '@/lib/siteMetadata'

export const dynamic = 'force-dynamic'

export const metadata = createPageMetadata({
  pathname: '/articles',
  description: 'Myshkin 451 的中文写作、长文和公共札记。',
  title: '写作',
})

export default async function ArticlesPage() {
  const articles = await listPublishedArticles()
  const latestArticle = articles[0]
  const articleGroups = groupByPublicationYear(articles)

  return (
    <div className="site-shell theme-light site-shell--archive">
      <SiteHeader />

      <main className="site-main archive-main">
        <section className="archive-hero" aria-labelledby="articles-title">
          <div className="page-heading page-heading--wide">
            <p className="eyebrow">写作档案 / Archive Ledger</p>
            <h1 id="articles-title">把长文整理成可追踪的阅读账本。</h1>
            <p>
              这里收纳需要被认真展开的文字：文章、技术笔记、学习路径，以及持续思考留下的公共记录。
              页面保持轻、亮、可扫描，让中文长文先服务阅读，再进入平台结构。
            </p>
          </div>

          <aside className="archive-status" aria-label="写作状态">
            <dl>
              <div>
                <dt>已发布</dt>
                <dd>{articles.length} 篇</dd>
              </div>
              <div>
                <dt>最新年份</dt>
                <dd>{latestArticle ? getPublicationYear(latestArticle.publishedAt) : '待发布'}</dd>
              </div>
              <div>
                <dt>阅读策略</dt>
                <dd>中文优先，保留英文路径</dd>
              </div>
            </dl>
          </aside>
        </section>

        {latestArticle ? (
          <section className="featured-entry featured-entry--writing" aria-label="最新文章">
            <div className="featured-entry__body">
              <p className="eyebrow">最新文章</p>
              <h2>
                <Link href={`/articles/${latestArticle.slug}`}>{latestArticle.title}</Link>
              </h2>
              <p>{latestArticle.excerpt}</p>
              <p className="featured-entry__meta">
                {latestArticle.publishedAt ? (
                  <time dateTime={latestArticle.publishedAt}>
                    {formatDate(latestArticle.publishedAt)}
                  </time>
                ) : null}
                <span>
                  {getReadingMinutes(latestArticle.content, latestArticle.excerpt)} 分钟阅读
                </span>
              </p>
              <Link className="inline-link" href={`/articles/${latestArticle.slug}`}>
                阅读全文
              </Link>
            </div>
            <CoverImage
              image={latestArticle.coverImage}
              priority
              sizes="(max-width: 880px) 100vw, 430px"
            />
          </section>
        ) : null}

        <section className="archive-ledger" aria-label="文章档案">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">Ledger</p>
              <h2>按年份排布的公共写作。</h2>
            </div>
            <p>
              先让每篇文章有清楚的时间、摘要和阅读预期。等内容变多后，这里可以自然扩展为主题索引或搜索入口。
            </p>
          </div>

          {articles.length > 0 ? (
            articleGroups.map((group) => (
              <section
                aria-labelledby={`articles-${group.year}`}
                className="ledger-year"
                key={group.year}
              >
                <h3 id={`articles-${group.year}`}>{group.year}</h3>
                <ol className="ledger-list">
                  {group.items.map((article) => (
                    <li className="ledger-row" key={article.id}>
                      <time
                        className="ledger-row__date"
                        dateTime={article.publishedAt ?? undefined}
                      >
                        {article.publishedAt ? formatDate(article.publishedAt) : '待定'}
                      </time>
                      <div className="ledger-row__body">
                        <Link
                          aria-label={article.title}
                          className="ledger-row__title"
                          href={`/articles/${article.slug}`}
                        >
                          {article.title}
                        </Link>
                        <p>{article.excerpt}</p>
                      </div>
                      <p className="ledger-row__meta">
                        <span>{getReadingMinutes(article.content, article.excerpt)} 分钟</span>
                        <span>中文优先</span>
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            ))
          ) : (
            <div className="empty-panel">
              <h2>还没有公开文章。</h2>
              <p>第一批通过 CMS 发布的文章会出现在这里。</p>
            </div>
          )}
        </section>

        <section className="surface-index surface-index--detail" aria-label="平台入口索引">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">Surface Index</p>
              <h2>写作仍然连接到整个平台。</h2>
            </div>
            <p>文章不是孤立归档；它们会继续连接项目、知识路径和未来的小型实验。</p>
          </div>
          <SurfaceIndex compact />
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
