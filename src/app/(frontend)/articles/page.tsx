import { ContentCard } from '../_components/ContentCard'
import { SiteHeader } from '../_components/SiteHeader'
import { listPublishedArticles } from '@/lib/publicContent'

export const dynamic = 'force-dynamic'

export const metadata = {
  description: 'Public writing from Myshkin 451.',
  title: 'Writing | Myshkin 451',
}

export default async function ArticlesPage() {
  const articles = await listPublishedArticles()

  return (
    <div className="site-shell">
      <SiteHeader />

      <main className="site-main">
        <section className="page-heading">
          <p className="eyebrow">Writing</p>
          <h1>Essays, notes, and longer traces of thought.</h1>
          <p>
            A public archive for work that benefits from being read slowly: essays, technical notes,
            study paths, and records of continued thinking.
          </p>
        </section>

        <section className="content-list" aria-label="Published articles">
          {articles.length > 0 ? (
            articles.map((article) => (
              <ContentCard
                coverImage={article.coverImage}
                href={`/articles/${article.slug}`}
                key={article.id}
                label="Article"
                publishedAt={article.publishedAt}
                summary={article.excerpt}
                title={article.title}
              />
            ))
          ) : (
            <div className="empty-panel">
              <h2>No public articles yet.</h2>
              <p>Published articles will appear here after the first CMS publishing pass.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
