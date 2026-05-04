import { ContentCard } from '../_components/ContentCard'
import { SiteHeader } from '../_components/SiteHeader'
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

  return (
    <div className="site-shell">
      <SiteHeader />

      <main className="site-main">
        <section className="page-heading">
          <p className="eyebrow">写作 / Writing</p>
          <h1>适合慢读的长文、札记和思考痕迹。</h1>
          <p>
            这里收纳需要被认真展开的文字：文章、技术笔记、学习路径，以及持续思考留下的公共记录。
          </p>
        </section>

        <section className="content-list" aria-label="已发布文章">
          {articles.length > 0 ? (
            articles.map((article) => (
              <ContentCard
                coverImage={article.coverImage}
                href={`/articles/${article.slug}`}
                key={article.id}
                label="文章"
                publishedAt={article.publishedAt}
                summary={article.excerpt}
                title={article.title}
              />
            ))
          ) : (
            <div className="empty-panel">
              <h2>还没有公开文章。</h2>
              <p>第一批通过 CMS 发布的文章会出现在这里。</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
