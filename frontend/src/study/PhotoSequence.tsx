import { useCallback, useEffect, useId, useRef, useState, type PointerEvent } from 'react'
import type { Photo } from '../types'
import './photo-sequence.css'

function Arrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M19 12H5m6-6-6 6 6 6' : 'M5 12h14m-6-6 6 6-6 6'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Lightbox({
  photos,
  title,
  index,
  onIndex,
  onClose,
  returnFocus,
}: {
  photos: Photo[]
  title: string
  index: number
  onIndex: (index: number) => void
  onClose: () => void
  returnFocus: HTMLButtonElement | null
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const thumbnails = useRef<HTMLDivElement>(null)
  const swipe = useRef<{ pointer: number; x: number; y: number; vertical: boolean } | null>(null)
  const headingId = useId()
  const photo = photos[index]

  function move(direction: number) {
    onIndex((index + direction + photos.length) % photos.length)
  }

  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'touch' || photos.length < 2) return
    if (!event.isPrimary) {
      swipe.current = null
      return
    }
    swipe.current = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      vertical: false,
    }
  }

  function trackSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = swipe.current
    if (!start || start.pointer !== event.pointerId) return
    const horizontal = Math.abs(event.clientX - start.x)
    const vertical = Math.abs(event.clientY - start.y)
    if (vertical > 10 && vertical > horizontal) start.vertical = true
  }

  function finishSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = swipe.current
    swipe.current = null
    if (!start || start.pointer !== event.pointerId || start.vertical) return
    const horizontal = event.clientX - start.x
    const vertical = event.clientY - start.y
    if (Math.abs(horizontal) >= 48 && Math.abs(horizontal) > Math.abs(vertical) * 1.5) {
      move(horizontal < 0 ? 1 : -1)
    }
  }

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    const previousOverflow = document.body.style.overflow
    element.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      element.close()
      document.body.style.overflow = previousOverflow
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true })
    }
  }, [returnFocus])

  useEffect(() => {
    const strip = thumbnails.current
    const current = strip?.children.item(index) as HTMLButtonElement | null
    if (!strip || !current) return
    const left = current.offsetLeft
    const right = left + current.offsetWidth
    if (left < strip.scrollLeft) strip.scrollLeft = left
    else if (right > strip.scrollLeft + strip.clientWidth)
      strip.scrollLeft = right - strip.clientWidth
    if (strip.contains(document.activeElement)) current.focus({ preventScroll: true })
  }, [index])

  return (
    <dialog
      ref={dialog}
      className="study-lightbox"
      aria-labelledby={headingId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || photos.length < 2) return
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault()
          move(event.key === 'ArrowRight' ? 1 : -1)
        }
      }}
    >
      <div className="study-lightbox__layout">
        <header className="study-lightbox__header">
          <h2 id={headingId}>{title}</h2>
          <button className="study-lightbox__close" type="button" onClick={onClose}>
            <span>关闭</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="m6 6 12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>
        <figure className="study-lightbox__figure">
          <div
            className="study-lightbox__image"
            onPointerDown={startSwipe}
            onPointerMove={trackSwipe}
            onPointerUp={finishSwipe}
            onPointerCancel={() => {
              swipe.current = null
            }}
          >
            <img
              key={photo.id}
              src={photo.src}
              alt={photo.alt || photo.caption || title}
              draggable="false"
            />
          </div>
          <figcaption className="study-lightbox__caption" aria-live="polite" aria-atomic="true">
            {photo.caption && <span>{photo.caption}</span>}
            {photo.credit && <small>{photo.credit}</small>}
          </figcaption>
        </figure>
        <footer className="study-lightbox__footer">
          {photos.length > 1 && (
            <div
              ref={thumbnails}
              className="study-lightbox__thumbnails"
              role="group"
              aria-label="选择照片"
            >
              {photos.map((item, itemIndex) => (
                <button
                  key={item.id}
                  className="study-lightbox__thumbnail"
                  type="button"
                  aria-label={`查看第 ${itemIndex + 1} 张：${item.caption || item.alt || title}`}
                  aria-current={itemIndex === index ? 'true' : undefined}
                  onClick={() => onIndex(itemIndex)}
                >
                  <img src={item.src} alt="" draggable="false" />
                </button>
              ))}
            </div>
          )}
          <div className="study-lightbox__footer-actions">
            <span className="study-lightbox__position" aria-live="polite" aria-atomic="true">
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span aria-hidden="true">/</span>
              <span className="study-lightbox__total" aria-hidden="true">
                {String(photos.length).padStart(2, '0')}
              </span>
              <span className="study-lightbox__sr-only">
                第 {index + 1} 张，共 {photos.length} 张
              </span>
            </span>
            {photos.length > 1 && (
              <div className="study-lightbox__controls">
                <button type="button" aria-label="上一张照片" onClick={() => move(-1)}>
                  <Arrow direction="left" />
                </button>
                <button type="button" aria-label="下一张照片" onClick={() => move(1)}>
                  <Arrow direction="right" />
                </button>
              </div>
            )}
          </div>
        </footer>
      </div>
    </dialog>
  )
}

export function PhotoSequence({ photos, title }: { photos: Photo[]; title: string }) {
  const [layout, setLayout] = useState<'overview' | 'expanded'>('overview')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [returnFocus, setReturnFocus] = useState<HTMLButtonElement | null>(null)
  const close = useCallback(() => setSelectedIndex(null), [])
  if (!photos.length) return null

  return (
    <section className={`photo-sequence photo-sequence--${layout}`} aria-label={`${title}图集`}>
      <div className="photo-sequence__toolbar">
        <span>{photos.length} 张图片</span>
        {photos.length > 1 && (
          <div className="photo-sequence__layouts" role="group" aria-label="图集排列">
            <button
              type="button"
              aria-pressed={layout === 'expanded'}
              onClick={() => setLayout('expanded')}
            >
              展开
            </button>
            <button
              type="button"
              aria-pressed={layout === 'overview'}
              onClick={() => setLayout('overview')}
            >
              总览
            </button>
          </div>
        )}
      </div>
      <div className="photo-sequence__grid">
        {photos.map((photo, index) => (
          <figure className="photo-sequence__item" key={photo.id}>
            <button
              className="photo-sequence__open"
              type="button"
              aria-label={`查看大图：${photo.caption || photo.alt || title}，第 ${index + 1} 张，共 ${photos.length} 张`}
              aria-haspopup="dialog"
              onClick={(event) => {
                setReturnFocus(event.currentTarget)
                setSelectedIndex(index)
              }}
            >
              <img src={photo.src} alt={photo.alt || photo.caption || title} loading="lazy" />
              <span className="photo-sequence__expand" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            <figcaption className="photo-sequence__caption">
              <span className="photo-sequence__number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{photo.caption || title}</span>
              {photo.credit && <small>{photo.credit}</small>}
            </figcaption>
          </figure>
        ))}
      </div>
      {selectedIndex !== null && (
        <Lightbox
          photos={photos}
          title={title}
          index={Math.min(selectedIndex, photos.length - 1)}
          onIndex={setSelectedIndex}
          onClose={close}
          returnFocus={returnFocus}
        />
      )}
    </section>
  )
}
