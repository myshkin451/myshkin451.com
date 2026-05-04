import Link from 'next/link'

import { formatDate } from '@/lib/formatDate'

import { CoverImage } from './CoverImage'

type ContentCardProps = {
  coverImage?: Parameters<typeof CoverImage>[0]['image']
  href: string
  label: string
  meta?: string
  publishedAt?: null | string
  summary: string
  title: string
}

export function ContentCard({
  coverImage,
  href,
  label,
  meta,
  publishedAt,
  summary,
  title,
}: ContentCardProps) {
  return (
    <article className="content-card">
      <CoverImage image={coverImage} />
      <div className="content-card__body">
        <p className="content-card__meta">
          <span>{label}</span>
          {publishedAt ? <time dateTime={publishedAt}>{formatDate(publishedAt)}</time> : null}
          {meta ? <span>{meta}</span> : null}
        </p>
        <h2>
          <Link href={href}>{title}</Link>
        </h2>
        <p>{summary}</p>
      </div>
    </article>
  )
}
