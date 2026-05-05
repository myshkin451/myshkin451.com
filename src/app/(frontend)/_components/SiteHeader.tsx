import Link from 'next/link'

import { ThemeToggle } from './ThemeToggle'
import { primaryNav } from '../_lib/platformSurfaces'
import { uiCopy } from '../_lib/uiCopy'
import { siteConfig } from '@/lib/siteMetadata'

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <span className="brand__mark">M451</span>
        <span className="brand__text">
          <span className="brand__name">Myshkin 451</span>
          <span className="brand__subtitle">{uiCopy.siteChrome.brandSubtitle}</span>
        </span>
      </Link>
      <nav aria-label={uiCopy.siteChrome.navAriaLabel} className="site-nav">
        {primaryNav.map((item) => (
          <Link href={item.href} key={item.href}>
            <span>{item.label}</span>
            <small>{item.english}</small>
          </Link>
        ))}
      </nav>
      <div className="site-header__meta" aria-label={uiCopy.siteChrome.statusAriaLabel}>
        <span>{uiCopy.siteChrome.languageLabel}</span>
        <ThemeToggle />
        <Link href="/admin">{uiCopy.siteChrome.adminLabel}</Link>
        <a href={siteConfig.githubUrl} rel="noreferrer" target="_blank">
          {uiCopy.siteChrome.sourceLabel}
        </a>
      </div>
    </header>
  )
}
