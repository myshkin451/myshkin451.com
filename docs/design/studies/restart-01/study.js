;(() => {
  'use strict'

  const $ = (id) => document.getElementById(id)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const storageKey = 'myshkin-restart-study-01'
  const studies = {
    a: {
      title: 'A / 页间',
      description: '让文字与作品像一本个人刊物，在同一页相遇。',
      tradeoff: 'A 把阅读和版面节奏放在前面。它安静、有编辑感，代价是第一眼的互动冲动较弱。',
    },
    b: {
      title: 'B / 游乐室',
      description: '先玩一会儿，再认识做这些东西的人。',
      tradeoff:
        'B 让作品和交互成为第一印象。它更有活力，但需要有趣的实际作品支撑，文章页也需要更安静的处理。',
    },
    c: {
      title: 'C / 线索',
      description: '沿着一个念头，走进相互关联的文字与作品。',
      tradeoff:
        'C 鼓励顺着兴趣探索，也能容纳未完成的想法。它需要真实的内容关联，不能只画一张好看的空地图。',
    },
  }

  const content = {
    essay: {
      category: '写作 / 一份重新开始的想法',
      title: '重新拥有一小块互联网',
      intro: '当每个空间都在邀请我们表演，我想试试，为自己留一处可以慢慢写的地方。',
      body: `<p>如果一个网站暂时没有人看，它还值得存在吗？</p>
        <p>我想，至少可以先把它当成一个房间。桌上放着做了一半的东西，书里夹着尚未理解的句子。来的人不多，也不妨碍下午的光照进来。</p>
        <p>一个属于自己的地方，应该允许停顿。允许写得很短，也允许花很长时间把一个问题想清楚。允许做一个暂时派不上用场的小东西，然后因为喜欢，就把它留在那里。</p>
        <h3>从一件小事开始</h3>
        <p>也许先放下一篇文字，一件可以操作的作品，再留下一点关于它们的说明。页面慢慢变化，新的兴趣会带来新的形状。</p>
        <blockquote>先给好奇心一个可以落脚的地方。</blockquote>
        <p>我希望以后回来时，能看见一些当时很在意的事情。它们可能已经变了，但那些尝试过的痕迹还在。</p>`,
    },
    project: {
      category: '作品 / 交互习作',
      title: '光的练习',
      intro: '把圆、弧线与颜色变成一个可以拨动的小东西。没有目标，也没有正确的形状。',
      body: `<p>这件习作从一个很小的问题出发：只用线条，能不能让一个平面的图形拥有体积感？</p>
        <p>一组圆环围绕同一个中心排列。改变它们的间距、观察的角度和颜色，光就像从缝隙中穿了过去。</p>
        <h3>你可以这样玩</h3>
        <ul><li>拖动“松开一点”，调整线条雕塑的形状。</li><li>换一种颜色，观察相同结构产生的不同气氛。</li><li>让它缓慢旋转，或停在你喜欢的角度。</li></ul>
        <p>这只是原型里的示例作品，用来感受未来的项目可以怎样被展示。</p>
        <button type="button" class="inline-play" data-go="b">打开光的练习 ↗</button>`,
    },
    note: {
      category: '片段 / 一个还没展开的念头',
      title: '给无用之物留个位置',
      intro: '有些东西的价值，要等做出来以后才知道。也可能只是因为做它的时候很快乐。',
      body: `<p>一段小动画，一张反复调整的图，一段暂时没有结论的文字。它们很难被装进“成果”这个词里，却常常是下一件事情的起点。</p>
        <p>如果每个念头都必须先证明有用，我们可能永远不会开始某些有意思的尝试。</p>
        <blockquote>留一个位置，让它先存在。</blockquote>
        <p>这个片段和“光的练习”相连：做一个小东西，看看它会把自己带到哪里。</p>`,
    },
    about: {
      category: '关于 / 一个暂时的开场',
      title: '这个地方，还在长大',
      intro: '写一点，做一点。把喜欢的事情放在同一个地方，让它们慢慢发生联系。',
      body: `<p>Myshkin 451 目前是这个空间的工作名称。这里可以有文字、作品、小实验，也可以放下还不完整的想法。</p>
        <p>这份设计研究用同一组示例内容，试着寻找三种不同的气质。你正在读的文字是为原型写的示例，不是已经发表的个人声明。</p>
        <h3>接下来会发生什么</h3><p>先根据实际感受选出想保留的部分，再把它们做成可以持续发布内容的网站。名字、域名和具体的视觉语言都仍有讨论空间。</p>`,
    },
  }

  let active = 'a'
  let preferences = { favorites: [], note: '' }
  let storageAvailable = true
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey) || 'null')
    if (saved && typeof saved === 'object') {
      preferences = {
        favorites: Array.isArray(saved.favorites)
          ? [...new Set(saved.favorites.filter((key) => Object.hasOwn(studies, key)))]
          : [],
        note: typeof saved.note === 'string' ? saved.note.slice(0, 5000) : '',
      }
    }
  } catch {
    storageAvailable = false
  }
  $('feedback').value = preferences.note
  $('feedback').maxLength = 5000

  function savePreferences() {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(preferences))
      storageAvailable = true
    } catch {
      storageAvailable = false
    }
    if (!storageAvailable) {
      $('feedback-status').textContent = '当前浏览器无法保存，请复制感受后再关闭页面。'
    }
  }

  function renderPreferences() {
    const selected = preferences.favorites.includes(active)
    $('favorite').setAttribute('aria-pressed', String(selected))
    $('favorite').textContent = selected ? '♥ 已记下这个方向' : '♡ 这个方向有感觉'
    $('saved-choices').textContent = preferences.favorites.length
      ? `目前有感觉：${preferences.favorites.map((key) => studies[key].title).join('、')}`
      : '还没有偏向，也完全可以。'
  }

  function setDirection(key) {
    if (!Object.hasOwn(studies, key)) return
    active = key
    for (const name of Object.keys(studies)) $('direction-' + name).hidden = name !== key
    document.querySelectorAll('[data-direction]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.direction === key))
    })
    $('study-name').textContent = studies[key].title
    $('study-description').textContent = studies[key].description
    $('tradeoff').textContent = studies[key].tradeoff
    renderPreferences()
    try {
      history.replaceState(null, '', '#' + key)
    } catch {
      // Local file viewers may disallow History API updates; the UI remains functional.
    }
    updateMotion()
  }

  document.querySelectorAll('[data-direction]').forEach((button) => {
    button.addEventListener('click', () => setDirection(button.dataset.direction))
  })
  $('phone-toggle').addEventListener('click', () => {
    const phone = $('preview').dataset.device !== 'phone'
    $('preview').dataset.device = phone ? 'phone' : 'desktop'
    $('phone-toggle').setAttribute('aria-pressed', String(phone))
    $('phone-toggle').textContent = phone ? '回到桌面' : '手机预览'
  })
  function setPlan(open) {
    $('next-plan').hidden = !open
    $('plan-toggle').setAttribute('aria-expanded', String(open))
  }
  $('plan-toggle').addEventListener('click', () => setPlan($('next-plan').hidden))
  $('bottom-plan').addEventListener('click', () => {
    setPlan(true)
    $('next-plan').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' })
    $('plan-toggle').focus({ preventScroll: true })
  })
  $('favorite').addEventListener('click', () => {
    preferences.favorites = preferences.favorites.includes(active)
      ? preferences.favorites.filter((key) => key !== active)
      : [...preferences.favorites, active]
    savePreferences()
    renderPreferences()
  })
  $('feedback').addEventListener('input', () => {
    preferences.note = $('feedback').value
    savePreferences()
    if (storageAvailable) $('feedback-status').textContent = '感受已保存在这个浏览器中。'
  })
  $('copy-feedback').addEventListener('click', async () => {
    const favorites =
      preferences.favorites.map((key) => studies[key].title).join('、') || '暂未选定'
    const value = `个人平台设计研究 01\n有感觉的方向：${favorites}\n我的感受：${preferences.note || '还在比较'}\n请根据这些反馈继续收敛设计。`
    try {
      await navigator.clipboard.writeText(value)
      $('feedback-status').textContent = '已复制，可以直接粘贴回对话。'
    } catch {
      $('feedback-status').textContent =
        `复制未获允许。有感觉的方向：${favorites}。可以选中下方文字手动复制。`
      $('feedback').focus()
      $('feedback').select()
    }
  })

  $('print-flip').addEventListener('click', () => {
    const flipped = $('print-flip').getAttribute('aria-pressed') !== 'true'
    $('print-flip').setAttribute('aria-pressed', String(flipped))
    $('print-flip').setAttribute('aria-label', flipped ? '翻回光的练习正面' : '翻看光的练习背面')
    document.querySelector('.print-back').setAttribute('aria-hidden', String(!flipped))
    document.querySelector('.print-front').setAttribute('aria-hidden', String(flipped))
  })

  function openReader(key) {
    const entry = content[key]
    if (!entry) return
    $('reader-label').textContent =
      key === 'project' ? '示例作品 · 供展示体验' : '示例文字 · 供版式试读'
    $('reader-category').textContent = entry.category
    $('reader-title').textContent = entry.title
    $('reader-intro').textContent = entry.intro
    $('reader-body').innerHTML = entry.body
    $('reader').showModal()
    $('reader').scrollTop = 0
  }

  document.addEventListener('click', (event) => {
    const readButton = event.target.closest('[data-read]')
    if (readButton) openReader(readButton.dataset.read)
    const goButton = event.target.closest('[data-go]')
    if (goButton) {
      if ($('reader').open) $('reader').close()
      setDirection(goButton.dataset.go)
      $('preview').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' })
      document
        .querySelector(`[data-direction="${goButton.dataset.go}"]`)
        .focus({ preventScroll: true })
    }
    const home = event.target.closest('[data-home]')
    if (home) {
      event.preventDefault()
      $('preview').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' })
    }
  })
  $('reader').addEventListener('click', (event) => {
    if (event.target !== $('reader')) return
    const box = $('reader').getBoundingClientRect()
    if (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    ) {
      $('reader').close()
    }
  })

  document.querySelectorAll('[data-topic]').forEach((button) => {
    button.addEventListener('click', () => setTopic(button.dataset.topic))
  })
  function setTopic(key) {
    const item = content[key]
    $('c-selected-type').textContent = item.category
    $('c-selected-title').textContent = item.title
    $('c-selected-copy').textContent = item.intro
    $('c-open').dataset.read = key
    $('c-open').innerHTML =
      `${key === 'project' ? '打开作品' : '读一读'} <span aria-hidden="true">↗</span>`
    document.querySelectorAll('[data-topic]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.topic === key))
    })
    document.querySelectorAll('[data-connection]').forEach((path) => {
      path.classList.toggle('active', path.dataset.connection === key)
    })
  }

  // A small original SVG sculpture. No assets, libraries, or network requests.
  const svgNS = 'http://www.w3.org/2000/svg'
  const ringCount = 38
  const paths = Array.from({ length: ringCount }, () => {
    const path = document.createElementNS(svgNS, 'path')
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke-width', '1.55')
    path.setAttribute('stroke-linejoin', 'round')
    $('orb-lines').appendChild(path)
    return path
  })
  const palettes = [
    [12, 59],
    [211, 295],
    [81, 165],
  ]
  const paletteNames = ['暖光', '暮色', '青绿']
  let palette = 0
  let spread = 48
  let tiltX = 0.94
  let tiltY = -0.3
  let phase = 0
  let playing = false
  let animation = 0
  let lastFrame = 0

  function drawOrb() {
    const tube = 39 + spread * 0.71
    const ring = 137
    const cx = Math.cos(tiltX)
    const sx = Math.sin(tiltX)
    const cy = Math.cos(tiltY + phase)
    const sy = Math.sin(tiltY + phase)
    for (let i = 0; i < ringCount; i++) {
      const u = (i / ringCount) * Math.PI * 2
      let d = ''
      for (let j = 0; j <= 80; j++) {
        const v = (j / 80) * Math.PI * 2
        const x = (ring + tube * Math.cos(v)) * Math.cos(u)
        const y = (ring + tube * Math.cos(v)) * Math.sin(u)
        const z = tube * Math.sin(v)
        const turnedX = x * cy + z * sy
        const turnedZ = -x * sy + z * cy
        const turnedY = y * cx - turnedZ * sx
        const depth = y * sx + turnedZ * cx
        const perspective = 750 / (750 + depth)
        const px = 300 + (turnedX * 0.955 - turnedY * 0.295) * perspective
        const py = 258 + (turnedX * 0.295 + turnedY * 0.955) * perspective
        d += `${j ? 'L' : 'M'}${px.toFixed(2)},${py.toFixed(2)}`
      }
      paths[i].setAttribute('d', d + 'Z')
      const hue =
        palettes[palette][0] + (i / ringCount) * (palettes[palette][1] - palettes[palette][0])
      paths[i].setAttribute('stroke', `hsl(${hue.toFixed(1)} 79% ${59 + Math.sin(u) * 10}%)`)
      paths[i].setAttribute('opacity', String(0.55 + ((Math.cos(u) + 1) / 2) * 0.35))
    }
    $('light-orb').dataset.spread = String(spread)
    $('light-orb').dataset.palette = paletteNames[palette]
    $('light-orb').dataset.phase = phase.toFixed(3)
  }

  function frame(time) {
    if (!(playing && active === 'b' && !document.hidden && !reducedMotion.matches)) {
      animation = 0
      return
    }
    if (lastFrame) phase += Math.min(time - lastFrame, 50) * 0.00021
    lastFrame = time
    drawOrb()
    animation = requestAnimationFrame(frame)
  }

  function updateMotion() {
    if (animation) cancelAnimationFrame(animation)
    animation = 0
    lastFrame = 0
    if (playing && active === 'b' && !document.hidden && !reducedMotion.matches)
      animation = requestAnimationFrame(frame)
    $('motion-toggle').setAttribute('aria-pressed', String(playing && !reducedMotion.matches))
    $('motion-toggle').disabled = reducedMotion.matches
    $('motion-toggle').textContent = reducedMotion.matches
      ? '减少动态效果已开启'
      : playing
        ? '停在这一刻 Ⅱ'
        : '让它转起来 ↻'
  }

  $('motion-toggle').addEventListener('click', () => {
    playing = !playing
    updateMotion()
  })
  document.addEventListener('visibilitychange', updateMotion)
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) playing = false
    updateMotion()
  })
  $('orb-spread').addEventListener('input', (event) => {
    spread = Number(event.target.value)
    $('orb-value').value = String(spread)
    drawOrb()
  })
  $('orb-color').addEventListener('click', () => {
    palette = (palette + 1) % palettes.length
    $('orb-color').innerHTML =
      `换一种颜色 · ${paletteNames[palette]} <span aria-hidden="true">↗</span>`
    drawOrb()
  })
  $('orb-stage').addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || playing || reducedMotion.matches) return
    const rect = $('orb-stage').getBoundingClientRect()
    tiltY = ((event.clientX - rect.left) / rect.width - 0.5) * 0.85
    tiltX = 0.94 + ((event.clientY - rect.top) / rect.height - 0.5) * 0.6
    drawOrb()
  })

  drawOrb()
  setTopic('essay')
  const requested = location.hash.slice(1)
  setDirection(Object.hasOwn(studies, requested) ? requested : 'a')
  if (!storageAvailable) $('feedback-status').textContent = '当前浏览器无法保存，离开前请复制感受。'
})()
