'use client'
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="community-auth-page">
      <section className="community-auth-panel">
        <h1>暂时无法打开网站</h1>
        <p>内容服务暂时不可用，请稍后重试。</p>
        <button className="button" onClick={reset}>
          重试
        </button>
      </section>
    </main>
  )
}
