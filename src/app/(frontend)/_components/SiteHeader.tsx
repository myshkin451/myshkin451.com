import Link from 'next/link'

import { primaryNav } from '../_lib/platformSurfaces'
import { siteConfig } from '@/lib/siteMetadata'

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <span className="brand__mark">M451</span>
        <span className="brand__text">
          <span className="brand__name">Myshkin 451</span>
          <span className="brand__subtitle">技术图谱与公共工坊</span>
        </span>
      </Link>
      <nav aria-label="主导航" className="site-nav">
        {primaryNav.map((item) => (
          <Link href={item.href} key={item.href}>
            <span>{item.label}</span>
            <small>{item.english}</small>
          </Link>
        ))}
      </nav>
      <div className="site-header__meta" aria-label="站点状态">
        <span>中文 / ZH</span>
        <Link href="/admin">Admin</Link>
        <a href={siteConfig.githubUrl} rel="noreferrer" target="_blank">
          Source
        </a>
      </div>
    </header>
  )
}
