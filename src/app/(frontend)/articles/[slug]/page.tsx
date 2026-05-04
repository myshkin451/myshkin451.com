import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CoverImage } from '../../_components/CoverImage'
import { RichTextView } from '../../_components/RichTextView'
import { SiteHeader } from '../../_components/SiteHeader'
import { SurfaceIndex } from '../../_components/SurfaceIndex'
import { getReadingMinutes } from '../../_lib/contentDisplay'
import { formatDate } from '@/lib/formatDate'
import { getPublishedArticleBySlug } from '@/lib/publicContent'
import { createPageMetadata } from '@/lib/siteMetadata'

export const dynamic = 'force-dynamic'

type ArticlePageProps = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getPublishedArticleBySlug(slug)

  if (!article) {
    return {
      title: '文章未找到 | Myshkin 451',
    }
  }

  return createPageMetadata({
    description: article.excerpt,
    image: article.coverImage,
    pathname: `/articles/${article.slug}`,
    title: article.title,
  })
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params
  const article = await getPublishedArticleBySlug(slug)

  if (!article) {
    notFound()
  }

  const readingMinutes = getReadingMinutes(article.content, article.excerpt)

  return (
    <div className="site-shell theme-light site-shell--reading">
      <SiteHeader />

      <main className="reading-main">
        <article className="reading-layout">
          <div className="reading-sheet">
            <header className="entry-header entry-header--reading">
              <p className="eyebrow">文章 / Article</p>
              <h1>{article.title}</h1>
              <p>{article.excerpt}</p>
              <div className="entry-meta">
                {article.publishedAt ? (
                  <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
                ) : null}
                <span>{readingMinutes} 分钟阅读</span>
                <span>中文优先</span>
              </div>
            </header>

            <CoverImage
              image={article.coverImage}
              priority
              sizes="(max-width: 900px) 100vw, 760px"
            />
            <RichTextView content={article.content} />

            <footer className="entry-footer">
              <p>
                这篇文章属于 Myshkin 451 的公开写作面，后续可以继续连接项目、知识路径或实验记录。
              </p>
              <div className="actions actions--compact">
                <Link href="/articles">回到写作档案</Link>
                <Link href="/projects">查看项目卷宗</Link>
              </div>
            </footer>
          </div>

          <aside className="reading-rail" aria-label="阅读轨道">
            <p className="eyebrow">Reading Rail</p>
            <dl className="rail-list">
              <div>
                <dt>状态</dt>
                <dd>已发布</dd>
              </div>
              <div>
                <dt>时间</dt>
                <dd>
                  {article.publishedAt ? (
                    <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
                  ) : (
                    '待定'
                  )}
                </dd>
              </div>
              <div>
                <dt>阅读预期</dt>
                <dd>{readingMinutes} 分钟</dd>
              </div>
              <div>
                <dt>路径</dt>
                <dd>/articles/{article.slug}</dd>
              </div>
            </dl>
            <Link className="rail-link" href="/articles">
              返回写作档案
            </Link>
          </aside>
        </article>

        <section className="surface-index surface-index--detail" aria-label="平台入口索引">
          <div className="section-heading section-heading--split">
            <div>
              <p className="eyebrow">Surface Index</p>
              <h2>阅读之后，回到工作台。</h2>
            </div>
            <p>文章可以只是文章，也可以成为项目、知识路径和实验之间的公共线索。</p>
          </div>
          <SurfaceIndex compact />
        </section>
      </main>
    </div>
  )
}
