import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './study.module.css'

const studyUrl = 'https://philosophy-study.vercel.app/'

export const metadata: Metadata = {
  title: '哲学学习室 · Myshkin 451',
  description: '阅读、练习与记录。',
  robots: { index: false, follow: false },
}

export default function StudyPage() {
  return (
    <div className={styles.page}>
      <a className="skip-link" href="#study-content">
        进入学习室
      </a>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Myshkin 451 首页">
          Myshkin 451
        </Link>
        <nav className={styles.nav} aria-label="网站导航">
          <Link href="/">首页</Link>
          <Link href="/notes">随记</Link>
          <Link href="/archive">内容</Link>
          <Link href="/study" aria-current="page">
            学习
          </Link>
          <Link href="/about">关于</Link>
        </nav>
        <a className={styles.open} href={studyUrl} target="_blank" rel="noopener noreferrer">
          独立打开 <span aria-hidden="true">↗</span>
        </a>
      </header>
      <main id="study-content" className={styles.main} tabIndex={-1}>
        <div className={styles.context}>
          <h1>哲学学习室</h1>
          <p>使用学习室账号查看个人作答与进度。加载或登录遇到问题时，可独立打开。</p>
        </div>
        <iframe
          className={styles.frame}
          src={studyUrl}
          title="哲学学习室"
          allow="clipboard-write"
          referrerPolicy="no-referrer"
        />
      </main>
    </div>
  )
}
