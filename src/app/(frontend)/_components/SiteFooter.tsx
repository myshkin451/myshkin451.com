import Link from 'next/link'

import { primaryNav } from '../_lib/platformSurfaces'
import { uiCopy } from '../_lib/uiCopy'
import { siteConfig } from '@/lib/siteMetadata'

export function SiteFooter() {
  return (
    <footer aria-label={uiCopy.siteFooter.ariaLabel} className="site-footer">
      <div className="site-footer__identity">
        <span>{uiCopy.siteFooter.brandLine}</span>
        <p>{uiCopy.siteFooter.systemStatus.status}</p>
      </div>

      <nav aria-label={uiCopy.siteFooter.surfacesLabel} className="site-footer__nav">
        {primaryNav.map((item) => (
          <Link href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <dl className="site-footer__status">
        <div>
          <dt>{uiCopy.siteFooter.language.label}</dt>
          <dd>{uiCopy.siteFooter.language.status}</dd>
        </div>
        <div>
          <dt>{uiCopy.siteFooter.feed.label}</dt>
          <dd>{uiCopy.siteFooter.feed.status}</dd>
        </div>
        <div>
          <dt>{uiCopy.siteFooter.source.label}</dt>
          <dd>
            <a href={siteConfig.githubUrl} rel="noreferrer" target="_blank">
              GitHub
            </a>
          </dd>
        </div>
      </dl>
    </footer>
  )
}
