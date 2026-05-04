import { notFound } from 'next/navigation'

import { CoverImage } from '../../_components/CoverImage'
import { RichTextView } from '../../_components/RichTextView'
import { SiteHeader } from '../../_components/SiteHeader'
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

  return (
    <div className="site-shell">
      <SiteHeader />

      <main className="article-main">
        <article className="entry">
          <header className="entry-header">
            <p className="eyebrow">文章 / Article</p>
            <h1>{article.title}</h1>
            <p>{article.excerpt}</p>
            {article.publishedAt ? (
              <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
            ) : null}
          </header>

          <CoverImage image={article.coverImage} priority sizes="(max-width: 720px) 100vw, 860px" />
          <RichTextView content={article.content} />
        </article>
      </main>
    </div>
  )
}
