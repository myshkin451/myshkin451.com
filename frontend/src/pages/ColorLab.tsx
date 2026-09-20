import { SiteLink } from '../navigation'
import { useState } from 'react'
import { Icon } from '../ui'
import { usePlatform } from '../platform'

const presets = [
  ['#d9e3a7', '#496252'],
  ['#f4bc92', '#b35667'],
  ['#adc3df', '#44547d'],
  ['#e6dcca', '#a28973'],
]

export function ColorLab() {
  const { entries } = usePlatform()
  const hasProject = entries.some(
    (entry) => entry.id === 'color-study' && entry.status === 'published',
  )
  const [first, setFirst] = useState(presets[0][0])
  const [second, setSecond] = useState(presets[0][1])
  const [angle, setAngle] = useState(135)
  const [notice, setNotice] = useState('')
  const css = `linear-gradient(${angle}deg, ${first}, ${second})`
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`background: ${css};`)
      setNotice('CSS 已复制。')
    } catch {
      setNotice('浏览器未允许复制，请选中下方 CSS 手动复制。')
    }
  }
  const download = () => {
    const rad = (angle * Math.PI) / 180
    const scale = (Math.abs(Math.sin(rad)) + Math.abs(Math.cos(rad))) / 2
    const x = Math.sin(rad) * scale
    const y = -Math.cos(rad) * scale
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><defs><linearGradient id="g" x1="${0.5 - x}" y1="${0.5 - y}" x2="${0.5 + x}" y2="${0.5 + y}"><stop stop-color="${first}"/><stop offset="1" stop-color="${second}"/></linearGradient></defs><path fill="url(#g)" d="M0 0h1200v1200H0z"/></svg>`
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `gradient-${angle}.svg`
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('SVG 已准备下载。')
  }
  return (
    <section className="color-lab">
      <SiteLink className="back-link" href={hasProject ? '#/entry/color-study' : '#/projects'}>
        <Icon name="back" size={16} />
        {hasProject ? '项目说明' : '返回项目'}
      </SiteLink>
      <div className="lab-heading">
        <h1>
          色彩练习<span className="heading-period">.</span>
        </h1>
        <p>两种颜色，一个方向。</p>
      </div>
      <div className="lab-workspace">
        <div
          className="lab-canvas"
          style={{ background: css }}
          role="img"
          aria-label={`从 ${first} 到 ${second} 的 ${angle} 度渐变`}
        >
          <div className="lab-canvas-caption">
            <span>{first.toUpperCase()}</span>
            <span>{second.toUpperCase()}</span>
          </div>
          <div className="lab-angle" style={{ transform: `rotate(${angle - 90}deg)` }}>
            <Icon name="arrow" size={25} />
          </div>
        </div>
        <div className="lab-controls">
          <div className="lab-control-title">
            <h2>调整渐变</h2>
            <span>01</span>
          </div>
          <div className="lab-colors">
            <label>
              <span>颜色 A</span>
              <div>
                <input
                  type="color"
                  value={first}
                  onChange={(e) => {
                    setFirst(e.target.value)
                    setNotice('')
                  }}
                  aria-label="颜色 A"
                />
                <code>{first.toUpperCase()}</code>
              </div>
            </label>
            <label>
              <span>颜色 B</span>
              <div>
                <input
                  type="color"
                  value={second}
                  onChange={(e) => {
                    setSecond(e.target.value)
                    setNotice('')
                  }}
                  aria-label="颜色 B"
                />
                <code>{second.toUpperCase()}</code>
              </div>
            </label>
          </div>
          <label className="lab-range">
            <span>
              方向<output>{angle}°</output>
            </span>
            <input
              type="range"
              min="0"
              max="360"
              value={angle}
              onChange={(e) => {
                setAngle(Number(e.target.value))
                setNotice('')
              }}
            />
          </label>
          <div className="lab-presets">
            <span>配色</span>
            <div>
              {presets.map(([a, b], i) => (
                <button
                  key={a}
                  aria-label={`配色 ${i + 1}`}
                  aria-pressed={first === a && second === b}
                  style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
                  onClick={() => {
                    setFirst(a)
                    setSecond(b)
                    setNotice('')
                  }}
                />
              ))}
            </div>
          </div>
          <div className="lab-actions">
            <button className="button" onClick={copy}>
              复制 CSS
              <Icon name="arrow" size={16} />
            </button>
            <button className="button secondary" onClick={download}>
              下载 SVG
              <Icon name="external" size={16} />
            </button>
          </div>
          <p className="lab-notice" role="status">
            {notice || '图片为 1200 × 1200，可继续编辑。'}
          </p>
        </div>
      </div>
      <div className="lab-code">
        <span>CSS</span>
        <code tabIndex={0}>background: {css};</code>
      </div>
    </section>
  )
}
