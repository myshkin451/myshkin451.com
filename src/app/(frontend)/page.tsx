import Link from 'next/link'
import React from 'react'

import './styles.css'

export default async function HomePage() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <Link className="brand" href="/">
          Myshkin 451
        </Link>
        <nav aria-label="Primary navigation">
          <Link href="/admin">Admin</Link>
          <a href="https://github.com/myshkin451/myshkin451.com">GitHub</a>
        </nav>
      </header>

      <main className="site-main">
        <section className="intro">
          <p className="eyebrow">Personal digital platform</p>
          <h1>A new foundation for writing, projects, knowledge, and experiments.</h1>
          <p className="summary">
            Phase 1 is about the first platform loop: create content in the admin surface, publish
            it with stable routes and media, and prove the workflow with repeatable checks.
          </p>
          <div className="actions">
            <Link href="/admin">Open admin</Link>
            <Link href="/api">Payload API</Link>
          </div>
        </section>

        <section className="status" aria-label="Platform status">
          <div>
            <span>Stack</span>
            <strong>Next.js + Payload + Postgres</strong>
          </div>
          <div>
            <span>Phase</span>
            <strong>Scaffold</strong>
          </div>
          <div>
            <span>Goal</span>
            <strong>First platform loop</strong>
          </div>
        </section>
      </main>
    </div>
  )
}
