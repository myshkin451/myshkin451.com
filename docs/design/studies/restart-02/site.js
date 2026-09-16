;(() => {
  'use strict'

  const $ = (id) => document.getElementById(id)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const dialog = $('torus-dialog')
  const stage = $('torus-stage')
  const colors = { silver: '#c7cbd4', amber: '#e8b783', blue: '#a1bbdc' }
  const initial = { x: 0.38, y: 0.22, radius: 52, color: 'silver' }
  let state = { ...initial }
  let playing = false
  let frameId = 0
  let previousTime = 0
  let drag = null

  function createWireframe(id) {
    const group = $(id)
    const curves = []
    for (const [axis, count] of [
      ['u', 32],
      ['v', 16],
    ]) {
      for (let index = 0; index < count; index++) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('stroke-width', axis === 'u' ? '0.9' : '1.05')
        group.appendChild(path)
        curves.push({ path, axis, angle: (index / count) * Math.PI * 2 })
      }
    }
    return curves
  }

  const thumbnail = createWireframe('thumbnail-lines')
  const live = createWireframe('torus-lines')

  function draw(curves, model, centerY, maxRadiusY) {
    const cx = Math.cos(model.x)
    const sx = Math.sin(model.x)
    const cy = Math.cos(model.y)
    const sy = Math.sin(model.y)
    let extentX = 0
    let extentY = 0
    const projected = curves.map((curve) => {
      const points = []
      let meanDepth = 0
      for (let i = 0; i <= 80; i++) {
        const angle = (i / 80) * Math.PI * 2
        const u = curve.axis === 'u' ? curve.angle : angle
        const v = curve.axis === 'v' ? curve.angle : angle
        const x = (150 + model.radius * Math.cos(v)) * Math.cos(u)
        const y = model.radius * Math.sin(v)
        const z = (150 + model.radius * Math.cos(v)) * Math.sin(u)
        const xx = x * cy + z * sy
        const zz = -x * sy + z * cy
        const yy = y * cx - zz * sx
        const depth = y * sx + zz * cx
        const perspective = 900 / (900 + depth)
        meanDepth += depth
        const px = xx * perspective
        const py = yy * perspective
        extentX = Math.max(extentX, Math.abs(px))
        extentY = Math.max(extentY, Math.abs(py))
        points.push([px, py])
      }
      return { curve, points, meanDepth }
    })
    // Keep the whole object visible at every allowed angle and tube radius.
    const scale = Math.min(1.35, 354 / extentX, maxRadiusY / extentY)
    for (const { curve, points, meanDepth } of projected) {
      const d = points
        .map(
          ([x, y], i) =>
            `${i ? 'L' : 'M'}${(400 + x * scale).toFixed(2)},${(centerY + y * scale).toFixed(2)}`,
        )
        .join('')
      curve.path.setAttribute('d', d + 'Z')
      curve.path.setAttribute('stroke', colors[model.color])
      curve.path.setAttribute(
        'opacity',
        String(Math.max(0.28, Math.min(0.83, 0.55 - meanDepth / 81 / 650))),
      )
    }
  }

  function drawLive() {
    draw(live, state, 230, 202)
    $('torus').dataset.angleX = state.x.toFixed(3)
    $('torus').dataset.angleY = state.y.toFixed(3)
    $('torus').dataset.radius = String(state.radius)
    $('torus').dataset.color = state.color
  }

  function syncMotion() {
    if (frameId) cancelAnimationFrame(frameId)
    frameId = 0
    previousTime = 0
    $('rotate').disabled = reducedMotion.matches
    $('rotate').textContent = reducedMotion.matches
      ? '动态效果已关闭'
      : playing
        ? '暂停旋转'
        : '自动旋转'
    $('rotate').setAttribute('aria-pressed', String(playing))
    if (playing && dialog.open && !document.hidden && !reducedMotion.matches) {
      frameId = requestAnimationFrame(frame)
    }
  }

  function frame(time) {
    if (!playing || !dialog.open || document.hidden || reducedMotion.matches) {
      frameId = 0
      return
    }
    if (previousTime) state.y += Math.min(time - previousTime, 50) * 0.00018
    previousTime = time
    drawLive()
    frameId = requestAnimationFrame(frame)
  }

  document.querySelectorAll('[data-open]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = $(button.dataset.open)
      if (target.open) return
      target.showModal()
      target.scrollTop = 0
      if (target === dialog) {
        drawLive()
        syncMotion()
      }
    })
  })

  document.querySelectorAll('dialog').forEach((modal) => {
    modal.addEventListener('click', (event) => {
      if (event.target !== modal) return
      const box = modal.getBoundingClientRect()
      if (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
      )
        modal.close()
    })
  })

  $('thickness').addEventListener('input', (event) => {
    state.radius = Number(event.target.value)
    drawLive()
  })
  document.querySelectorAll('input[name="color"]').forEach((input) => {
    input.addEventListener('change', () => {
      state.color = input.value
      drawLive()
    })
  })
  $('rotate').addEventListener('click', () => {
    playing = !playing
    syncMotion()
  })
  $('reset').addEventListener('click', () => {
    state = { ...initial }
    $('thickness').value = String(initial.radius)
    document.querySelector('input[name="color"][value="silver"]').checked = true
    playing = false
    syncMotion()
    drawLive()
  })

  stage.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY }
    playing = false
    syncMotion()
    stage.setPointerCapture(event.pointerId)
    stage.focus({ preventScroll: true })
  })
  stage.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return
    state.y += (event.clientX - drag.x) * 0.006
    state.x = Math.max(-1.4, Math.min(1.4, state.x + (event.clientY - drag.y) * 0.005))
    drag.x = event.clientX
    drag.y = event.clientY
    drawLive()
  })
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture'])
    stage.addEventListener(type, () => {
      drag = null
    })
  stage.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
    event.preventDefault()
    playing = false
    syncMotion()
    if (event.key === 'ArrowLeft') state.y -= 0.1
    if (event.key === 'ArrowRight') state.y += 0.1
    if (event.key === 'ArrowUp') state.x = Math.max(-1.4, state.x - 0.1)
    if (event.key === 'ArrowDown') state.x = Math.min(1.4, state.x + 0.1)
    drawLive()
  })
  dialog.addEventListener('close', () => {
    playing = false
    drag = null
    syncMotion()
  })
  document.addEventListener('visibilitychange', syncMotion)
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) playing = false
    syncMotion()
  })

  draw(thumbnail, initial, 214, 186)
  drawLive()
  syncMotion()
})()
