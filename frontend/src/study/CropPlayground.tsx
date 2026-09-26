import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import './crop-playground.css'

const formats = [
  { label: '原图', value: 'original', ratio: 1, description: '完整显示原图，不裁切' },
  { label: '3:2', value: 'landscape', ratio: 3 / 2, description: '横向 3:2' },
  { label: '16:9', value: 'wide', ratio: 16 / 9, description: '横向 16:9' },
  { label: '1:1', value: 'square', ratio: 1, description: '正方形，可放大取景' },
] as const

const sample = {
  src: './assets/sea.png',
  width: 1254,
  height: 1254,
  name: '海浪与礁石',
  sample: true,
}
const maxFileBytes = 20 * 1024 * 1024
const maxSourcePixels = 40_000_000
const maxOutputEdge = 4096
type Format = (typeof formats)[number]['value']
type ImageSource = typeof sample
type Notice = { message: string; error?: boolean }
const clamp = (value: number, minimum: number, maximum: number) =>
  Math.max(minimum, Math.min(maximum, value))
const rangeStyle = (value: number) => ({ '--crop-fill': `${value}%` }) as CSSProperties

export function CropPlayground({ compact = false }: { compact?: boolean }) {
  const id = useId()
  const [source, setSource] = useState<ImageSource>(sample)
  const [format, setFormat] = useState<Format>('wide')
  const [position, setPosition] = useState({ x: 50, y: 32 })
  const [zoom, setZoom] = useState(1)
  const [dragging, setDragging] = useState(false)
  const [guides, setGuides] = useState(false)
  const [touchEditing, setTouchEditing] = useState(false)
  const [imageReady, setImageReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const image = useRef<HTMLImageElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const loadRequest = useRef(0)
  const mounted = useRef(true)
  const temporaryUrls = useRef(new Set<string>())
  const drag = useRef<{ pointer: number; x: number; y: number; left: number; top: number } | null>(
    null,
  )
  const selected = formats.find((item) => item.value === format) ?? formats[2]
  const original = format === 'original'
  const ratio = original ? source.width / source.height : selected.ratio
  const cropWidth = Math.min(source.width, source.height * ratio) / zoom
  const cropHeight = cropWidth / ratio
  const horizontal = !original && source.width - cropWidth > 0.01
  const vertical = !original && source.height - cropHeight > 0.01
  const canMove = horizontal || vertical
  const outputScale = Math.min(1, maxOutputEdge / Math.max(cropWidth, cropHeight))
  const width = Math.max(1, Math.round(cropWidth * outputScale))
  const height = Math.max(1, Math.round(cropHeight * outputScale))
  const busy = loading || exporting
  const pristine =
    format === 'wide' &&
    position.x === 50 &&
    position.y === (source.sample ? 32 : 50) &&
    zoom === 1 &&
    !guides &&
    !touchEditing

  useEffect(() => {
    mounted.current = true
    const urls = temporaryUrls.current
    return () => {
      mounted.current = false
      loadRequest.current += 1
      urls.forEach((url) => URL.revokeObjectURL(url))
      urls.clear()
    }
  }, [])

  useEffect(() => {
    const src = source.src
    const urls = temporaryUrls.current
    return () => {
      if (src.startsWith('blob:')) {
        URL.revokeObjectURL(src)
        urls.delete(src)
      }
    }
  }, [source.src])

  function reset(nextSource = source) {
    setFormat('wide')
    setPosition({ x: 50, y: nextSource.sample ? 32 : 50 })
    setZoom(1)
    setGuides(false)
    setTouchEditing(false)
    setNotice(null)
  }

  function chooseFormat(next: Format) {
    setFormat(next)
    setNotice(null)
    setTouchEditing(false)
    if (next === 'original') {
      setPosition({ x: 50, y: 50 })
      setZoom(1)
      setTouchEditing(false)
    }
  }

  function chooseFile(file: File | undefined) {
    if (!file) return
    setNotice(null)
    if (
      !/\.(jpe?g|png|webp)$/i.test(file.name) ||
      (file.type && !/^image\/(jpeg|png|webp)$/.test(file.type))
    ) {
      setNotice({ message: '请选择 JPG、PNG 或 WebP 图片。', error: true })
      return
    }
    if (file.size > maxFileBytes) {
      setNotice({ message: '这张图片超过 20 MB，请先缩小文件后再选择。', error: true })
      return
    }
    const request = ++loadRequest.current
    setLoading(true)
    const url = URL.createObjectURL(file)
    temporaryUrls.current.add(url)
    const probe = new Image()
    const discard = () => {
      URL.revokeObjectURL(url)
      temporaryUrls.current.delete(url)
    }
    probe.onload = () => {
      if (!mounted.current || request !== loadRequest.current) {
        discard()
        return
      }
      setLoading(false)
      if (
        !probe.naturalWidth ||
        !probe.naturalHeight ||
        probe.naturalWidth * probe.naturalHeight > maxSourcePixels ||
        Math.max(probe.naturalWidth, probe.naturalHeight) > 16000
      ) {
        discard()
        setNotice({
          message: '图片尺寸过大。请选择 4000 万像素以内、单边不超过 16000 像素的图片。',
          error: true,
        })
        return
      }
      const next = {
        src: url,
        width: probe.naturalWidth,
        height: probe.naturalHeight,
        name: file.name,
        sample: false,
      }
      setImageReady(false)
      setSource(next)
      reset(next)
    }
    probe.onerror = () => {
      discard()
      if (!mounted.current || request !== loadRequest.current) return
      setLoading(false)
      setNotice({ message: '没有读出这张图片，请换一个文件再试。', error: true })
    }
    probe.src = url
  }

  async function exportImage() {
    const element = image.current
    if (!element || !imageReady || busy) return
    setExporting(true)
    setNotice(null)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas unavailable')
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(
        element,
        ((source.width - cropWidth) * position.x) / 100,
        ((source.height - cropHeight) * position.y) / 100,
        cropWidth,
        cropHeight,
        0,
        0,
        width,
        height,
      )
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => (result ? resolve(result) : reject(new Error('PNG export failed'))),
          'image/png',
        )
      })
      canvas.width = 0
      canvas.height = 0
      if (!mounted.current) return
      const url = URL.createObjectURL(blob)
      temporaryUrls.current.add(url)
      const link = document.createElement('a')
      const name =
        source.name
          .replace(/\.[^.]+$/, '')
          .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
          .slice(0, 80) || 'image'
      link.href = url
      link.download = `${name}-${original ? 'original' : selected.label.replace(':', 'x')}.png`
      document.body.append(link)
      link.click()
      link.remove()
      window.setTimeout(() => {
        URL.revokeObjectURL(url)
        temporaryUrls.current.delete(url)
      }, 60_000)
      setNotice({ message: `已生成 ${width} × ${height} 像素的 PNG，并发起下载。` })
    } catch {
      if (mounted.current) setNotice({ message: '导出没有成功，请缩小图片后重试。', error: true })
    } finally {
      if (mounted.current) setExporting(false)
    }
  }

  function moveImage(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current
    if (!start || event.pointerId !== start.pointer) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const excessX = bounds.width * (source.width / cropWidth - 1)
    const excessY = bounds.height * (source.height / cropHeight - 1)
    setPosition({
      x: horizontal ? clamp(start.left - ((event.clientX - start.x) / excessX) * 100, 0, 100) : 50,
      y: vertical ? clamp(start.top - ((event.clientY - start.y) / excessY) * 100, 0, 100) : 50,
    })
  }

  function stopDragging(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointer !== event.pointerId) return
    drag.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }

  const frameStyle = {
    '--crop-aspect': ratio,
    '--crop-zoom': `${(source.width / cropWidth) * 100}%`,
    '--crop-x': `${position.x}%`,
    '--crop-y': `${position.y}%`,
  } as CSSProperties
  const hint = original
    ? '完整显示原图。选择其他比例后可裁切、放大。'
    : !canMove
      ? compact
        ? '原图为正方形，1:1 完整显示。'
        : '当前比例与原图一致。向右调节「放大」，即可移动取景。'
      : compact
        ? '鼠标拖动图像，触屏用下方滑块取景。'
        : touchEditing
          ? '拖动图片调整构图；完成后关闭移动模式，即可继续滑动页面。'
          : '拖动图片或用滑块取景。方向键微调，Shift + 方向键加快移动。'

  return (
    <section
      className={`crop-playground${compact ? ' crop-compact' : ''}`}
      aria-label="图像取景"
      aria-busy={busy}
    >
      {!compact && (
        <div className="crop-file-bar">
          <div className="crop-file-information">
            <span className="crop-file-name" title={source.name}>
              {source.name}
            </span>
            <span className="crop-source-size">
              {source.sample ? 'AI 生成样图' : '本机图片'} · {source.width} × {source.height} px
            </span>
          </div>
          <div className="crop-file-actions">
            {!source.sample && (
              <button
                type="button"
                className="crop-sample-button"
                disabled={busy}
                onClick={() => {
                  setImageReady(false)
                  setSource(sample)
                  reset(sample)
                }}
              >
                使用样图
              </button>
            )}
            <button
              type="button"
              className="crop-file-button"
              disabled={busy}
              onClick={() => fileInput.current?.click()}
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <path d="M7.5 3v9M3 7.5h9" />
              </svg>
              {loading ? '读取中…' : '选择图片'}
            </button>
            <input
              ref={fileInput}
              className="crop-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="选择本机图片"
              tabIndex={-1}
              onChange={(event) => {
                chooseFile(event.target.files?.[0])
                event.target.value = ''
              }}
            />
          </div>
        </div>
      )}

      <div
        className="crop-notice crop-notice-error"
        role="status"
        aria-live="assertive"
        aria-atomic="true"
      >
        {notice?.error ? notice.message : null}
      </div>

      <div className="crop-toolbar">
        <div className="crop-formats" role="group" aria-label="取景比例">
          {formats
            .filter((item) => !compact || item.value !== 'original')
            .map((item) => (
              <button
                key={item.value}
                type="button"
                className={`crop-format${format === item.value ? ' crop-selected' : ''}`}
                aria-pressed={format === item.value}
                title={item.description}
                disabled={busy}
                onClick={() => chooseFormat(item.value)}
              >
                {item.label}
              </button>
            ))}
        </div>
        <div className="crop-toolbar-actions">
          {!compact && (
            <button
              type="button"
              className={`crop-touch-toggle${touchEditing ? ' crop-selected' : ''}`}
              aria-pressed={touchEditing}
              disabled={!canMove || busy}
              onClick={() => setTouchEditing(!touchEditing)}
            >
              {touchEditing ? '完成移动' : '移动图片'}
            </button>
          )}
          <button
            type="button"
            className={`crop-guide-toggle${guides ? ' crop-selected' : ''}`}
            aria-label={guides ? '隐藏参考线' : '显示参考线'}
            aria-pressed={guides}
            disabled={busy}
            onClick={() => setGuides(!guides)}
            title={guides ? '隐藏参考线' : '显示参考线'}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <rect x="2.25" y="2.25" width="13.5" height="13.5" rx="1.5" />
              <path d="M6.75 2.25v13.5M11.25 2.25v13.5M2.25 6.75h13.5M2.25 11.25h13.5" />
            </svg>
          </button>
        </div>
      </div>

      <div className="crop-stage" style={frameStyle}>
        <div
          className={`crop-frame${dragging ? ' crop-dragging' : ''}${guides || dragging || touchEditing ? ' crop-show-guides' : ''}${!canMove ? ' crop-fixed' : ''}${touchEditing ? ' crop-touch-editing' : ''}`}
          role="group"
          tabIndex={canMove && !busy ? 0 : -1}
          aria-label={canMove ? '取景预览，可用方向键调整位置' : '完整图像预览'}
          aria-describedby={`${id}-hint`}
          onPointerDown={(event) => {
            if (
              !canMove ||
              busy ||
              drag.current !== null ||
              event.button !== 0 ||
              (event.pointerType === 'touch' && !touchEditing)
            )
              return
            event.currentTarget.setPointerCapture(event.pointerId)
            drag.current = {
              pointer: event.pointerId,
              x: event.clientX,
              y: event.clientY,
              left: position.x,
              top: position.y,
            }
            setDragging(true)
            setNotice(null)
          }}
          onPointerMove={moveImage}
          onPointerUp={stopDragging}
          onPointerCancel={stopDragging}
          onLostPointerCapture={() => {
            drag.current = null
            setDragging(false)
          }}
          onKeyDown={(event) => {
            if (busy) return
            const step = event.shiftKey ? 10 : 2
            const directions: Record<string, [number, number]> = {
              ArrowLeft: [-step, 0],
              ArrowRight: [step, 0],
              ArrowUp: [0, -step],
              ArrowDown: [0, step],
            }
            const direction = directions[event.key]
            if (!direction) return
            event.preventDefault()
            setNotice(null)
            setPosition((previous) => ({
              x: horizontal ? clamp(previous.x + direction[0], 0, 100) : previous.x,
              y: vertical ? clamp(previous.y + direction[1], 0, 100) : previous.y,
            }))
          }}
        >
          <img
            ref={image}
            className="crop-image"
            src={source.src}
            alt={source.sample ? '海浪与礁石，AI 生成的取景练习样图' : `所选图片：${source.name}`}
            width={source.width}
            height={source.height}
            draggable="false"
            onLoad={() => setImageReady(true)}
            onError={() => {
              setImageReady(false)
              setNotice({ message: '图片未能加载，请重新选择。', error: true })
            }}
          />
          <div className="crop-guides" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <span className="crop-corner crop-corner-tl" aria-hidden="true" />
          <span className="crop-corner crop-corner-tr" aria-hidden="true" />
          <span className="crop-corner crop-corner-bl" aria-hidden="true" />
          <span className="crop-corner crop-corner-br" aria-hidden="true" />
        </div>
        <div className="crop-stage-caption">
          <span>
            {source.sample ? 'AI 生成样图' : original ? '完整原图' : `${selected.label} 取景`}
          </span>
          <span className="crop-dimensions">
            {compact ? '' : '输出 '}
            {width} × {height} px
          </span>
        </div>
      </div>

      <div className="crop-controls">
        <div className="crop-sliders">
          {!compact && (
            <label
              className={`crop-slider${!horizontal ? ' crop-slider-inactive' : ''}`}
              htmlFor={`${id}-x`}
              title={!horizontal ? '当前图像已完整覆盖水平方向，放大后可移动' : '调整水平取景位置'}
            >
              <span>水平</span>
              <input
                id={`${id}-x`}
                type="range"
                min="0"
                max="100"
                value={position.x}
                style={rangeStyle(position.x)}
                disabled={!horizontal || busy}
                aria-valuetext={`${Math.round(position.x)}%`}
                onChange={(event) => {
                  setPosition({ ...position, x: Number(event.target.value) })
                  setNotice(null)
                }}
              />
              <output htmlFor={`${id}-x`}>{horizontal ? `${Math.round(position.x)}%` : '—'}</output>
            </label>
          )}
          <label
            className={`crop-slider${!vertical ? ' crop-slider-inactive' : ''}`}
            htmlFor={`${id}-y`}
            title={!vertical ? '当前图像已完整覆盖垂直方向' : '调整上下取景位置'}
          >
            <span>{compact ? '上下取景' : '垂直'}</span>
            <input
              id={`${id}-y`}
              type="range"
              min="0"
              max="100"
              value={position.y}
              style={rangeStyle(position.y)}
              disabled={!vertical || busy}
              aria-valuetext={`${Math.round(position.y)}%`}
              onChange={(event) => {
                setPosition({ ...position, y: Number(event.target.value) })
                setNotice(null)
              }}
            />
            <output htmlFor={`${id}-y`}>{vertical ? `${Math.round(position.y)}%` : '—'}</output>
          </label>
          {!compact && (
            <label
              className={`crop-slider${original ? ' crop-slider-inactive' : ''}`}
              htmlFor={`${id}-zoom`}
            >
              <span>放大</span>
              <input
                id={`${id}-zoom`}
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                style={rangeStyle((zoom - 1) * 50)}
                disabled={original || busy}
                aria-valuetext={`${zoom.toFixed(2)} 倍`}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  setZoom(value)
                  if (value === 1) setTouchEditing(false)
                  setNotice(null)
                }}
              />
              <output htmlFor={`${id}-zoom`}>{original ? '—' : `${zoom.toFixed(2)}×`}</output>
            </label>
          )}
        </div>
        <button
          type="button"
          className="crop-reset"
          disabled={pristine || busy}
          onClick={() => reset()}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 5.2A5 5 0 1 1 2.1 9M2 1.7v3.7h3.7" />
          </svg>
          复位
        </button>
      </div>
      <p className="crop-hint" id={`${id}-hint`}>
        {hint}
      </p>
      {!compact && (
        <div className="crop-export-bar">
          <p className="crop-privacy">
            图片仅在本机处理，不会上传。
            <span>JPG / PNG / WebP，最大 20 MB。导出最长边 4096 px。</span>
          </p>
          <button
            type="button"
            className="crop-export-button"
            disabled={!imageReady || busy}
            onClick={() => void exportImage()}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M7.5 1.5v8m-3-3 3 3 3-3M2 10v3h11v-3" />
            </svg>
            {exporting ? '生成中…' : '导出 PNG'}
          </button>
        </div>
      )}
      <div className="crop-notice" role="status" aria-live="polite" aria-atomic="true">
        {!notice?.error ? notice?.message : null}
      </div>
    </section>
  )
}
