import { notFound } from 'next/navigation'

import { CoverImage } from '../../_components/CoverImage'
import { RichTextView } from '../../_components/RichTextView'
import { SiteHeader } from '../../_components/SiteHeader'
import { formatDate } from '@/lib/formatDate'
import { getPublishedArticleBySlug } from '@/lib/publicContent'

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
      title: 'Article not found | Myshkin 451',
    }
  }

  return {
    description: article.excerpt,
    title: `${article.title} | Myshkin 451`,
  }
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
            <p className="eyebrow">Article</p>
            <h1>{article.title}</h1>
            <p>{article.excerpt}</p>
            {article.publishedAt ? (
              <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
            ) : null}
          </header>

          <CoverImage image={article.coverImage} />
          <RichTextView content={article.content} />
        </article>
      </main>
    </div>
  )
}
