import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="community-auth-page">
      <section className="community-auth-panel">
        <h1>没有找到这页</h1>
        <p>内容可能尚未发布或已撤下。</p>
        <Link className="button" href="/">
          返回首页
        </Link>
      </section>
    </main>
  )
}
