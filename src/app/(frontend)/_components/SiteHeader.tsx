import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        Myshkin 451
      </Link>
      <nav aria-label="Primary navigation">
        <Link href="/articles">Writing</Link>
        <Link href="/projects">Projects</Link>
        <Link href="/admin">Admin</Link>
        <a href="https://github.com/myshkin451/myshkin451.com">GitHub</a>
      </nav>
    </header>
  )
}
