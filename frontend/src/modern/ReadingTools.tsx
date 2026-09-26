import { useEffect, useRef, useState } from 'react'
import { Icon } from '../ui'

export function ReadingTools({
  headings,
  largeType,
  onType,
}: {
  headings: string[]
  largeType: boolean
  onType: () => void
}) {
  const [active, setActive] = useState(-1)
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const progress = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const article = document.querySelector('.article-copy')
    if (!article) return
    let frame = 0
    const measure = () => {
      const rect = article.getBoundingClientRect()
      const denominator = Math.max(1, rect.height - innerHeight + 180)
      const value = Math.max(0, Math.min(1, (130 - rect.top) / denominator))
      if (progress.current) progress.current.style.transform = `scaleX(${value})`
      let next = -1
      headings.forEach((_, index) => {
        if (
          (document.getElementById(`section-${index}`)?.getBoundingClientRect().top ?? Infinity) <
          200
        )
          next = index
      })
      setActive(next)
    }
    const scroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', scroll, { passive: true })
    window.addEventListener('resize', scroll)
    return () => {
      window.removeEventListener('scroll', scroll)
      window.removeEventListener('resize', scroll)
      cancelAnimationFrame(frame)
    }
  }, [headings])
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setCopyError('')
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopyError('未能复制，请从地址栏复制链接。')
    }
  }
  return (
    <aside className="reading-aside">
      <div className="modern-reading-progress" aria-hidden="true">
        <div ref={progress} />
      </div>
      {headings.length > 0 && (
        <nav aria-label="文章目录">
          <span>本文内容</span>
          {headings.map((heading, index) => (
            <button
              key={index}
              aria-current={active === index ? 'location' : undefined}
              onClick={() =>
                document.getElementById(`section-${index}`)?.scrollIntoView({
                  behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                    ? 'instant'
                    : 'smooth',
                  block: 'start',
                })
              }
            >
              {heading}
            </button>
          ))}
        </nav>
      )}
      <div className="modern-reading-actions">
        <button
          className={`reading-type ${largeType ? 'active' : ''}`}
          aria-pressed={largeType}
          onClick={onType}
        >
          <span className="modern-type-icon" aria-hidden="true">
            Aa
          </span>
          <span>{largeType ? '标准字号' : '放大字号'}</span>
        </button>
        <button className="modern-copy-link" onClick={copyLink}>
          <Icon name="external" size={16} />
          {copied ? '已复制链接' : '复制链接'}
        </button>
        <span className="sr-only" role="status">
          {copied ? '链接已复制' : ''}
        </span>
        {copyError && (
          <p className="modern-copy-error" role="status">
            {copyError}
          </p>
        )}
      </div>
    </aside>
  )
}
