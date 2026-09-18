window.mountStudyPage = function mountStudyPage() {
  'use strict'

  const navigation = window.studyNavigation
  const asset = (path) => window.studyAsset?.(path) || path
  const items = window.studyContent.map((item) =>
    item.image ? { ...item, image: asset(item.image) } : item,
  )
  let disposed = false
  const $ = (id) => document.getElementById(id)
  const page = document.body.dataset.page
  const params = new URLSearchParams(navigation?.search ?? window.location.search)
  const labels = { writing: '文字', project: '项目', image: '影像' }
  const view = page === 'catalog' || params.get('view') === 'catalog' ? 'catalog' : 'gallery'
  const home = view === 'catalog' ? 'catalog.html' : 'index.html'
  let filter = Object.hasOwn(labels, params.get('type')) ? params.get('type') : 'all'
  let query = page === 'catalog' ? (params.get('q') || '').slice(0, 120) : ''
  let selectedId = params.get('id') || 'sea'
  let visibleItems = []

  const esc = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    )
  const two = (value) => String(value).padStart(2, '0')

  function entryHref(item) {
    const search = new URLSearchParams({ id: item.id, view })
    if (filter !== 'all') search.set('type', filter)
    if (query) search.set('q', query)
    return `entry.html?${search}`
  }

  function saveBrowseState() {
    const search = new URLSearchParams()
    if (filter !== 'all') search.set('type', filter)
    if (query) search.set('q', query)
    if (page === 'catalog' && visibleItems.length) search.set('id', selectedId)
    if (navigation) {
      navigation.replace(search.toString())
      return
    }
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${search.size ? `?${search}` : ''}`,
    )
  }

  function cover(item) {
    if (item.cover === 'photo')
      return `<div class="cover photo-cover" aria-hidden="true"><img src="${item.image}" alt="" width="1254" height="1254" loading="lazy"></div>`
    if (item.cover === 'essay' || item.cover === 'notes')
      return `<div class="cover ${item.cover}-cover" aria-hidden="true"><span class="cover-number">${item.number}</span><strong>${item.title}</strong><p>${item.summary}</p><span class="cover-foot">${item.id === 'restart' ? '2026.09.17 · 设计记录样稿' : '排版样文'}</span></div>`
    if (item.cover === 'website')
      return `<div class="cover website-cover" aria-hidden="true"><div class="mini-site"><div class="mini-nav"><b>Myshkin 451</b><span>内容　关于 ↗</span></div><div class="mini-head"><span>最近</span><span>文字　项目　影像</span></div><div class="mini-grid"><figure><div class="mini-paper">重新做<br>这个网站</div><figcaption>设计记录</figcaption></figure><figure><img src="${asset('assets/sea.png')}" alt="" width="1254" height="1254" loading="lazy"><figcaption>海面</figcaption></figure><figure><div class="mini-code"><i></i><i></i><i></i></div><figcaption>图像配色</figcaption></figure></div></div></div>`
    return `<div class="cover palette-cover" aria-hidden="true"><div class="mini-palette"><strong>图像配色</strong><p>从图片中选取颜色</p><img src="${asset('assets/sea.png')}" alt="" width="1254" height="1254" loading="lazy"><div class="mini-swatches"><i style="background:#314a58"></i><i style="background:#688698"></i><i style="background:#a9bfce"></i><i style="background:#d8e1e8"></i></div></div></div>`
  }

  function applyChrome() {
    document.body.classList.toggle('catalog-theme', view === 'catalog')
    document.body.classList.toggle('gallery-theme', view === 'gallery')
    document.querySelector('.brand').href = home
    document.querySelector('.site-header nav a').href = home
    document.querySelector('.about-link').href =
      `about.html${view === 'catalog' ? '?view=catalog' : ''}`
    document.querySelectorAll('.study-switch a').forEach((link, index) => {
      link.removeAttribute('aria-current')
      if (index === (view === 'catalog' ? 1 : 0)) link.setAttribute('aria-current', 'page')
      if (index === 2) link.href = `concept-${view === 'catalog' ? 'catalog' : 'gallery'}.png`
    })
    if (page === 'about') document.querySelector('.about-link').setAttribute('aria-current', 'page')
    if ($('back-link')) {
      const back = new URLSearchParams()
      if (filter !== 'all') back.set('type', filter)
      if (params.get('q')) back.set('q', params.get('q').slice(0, 120))
      if (view === 'catalog' && params.get('id')) back.set('id', params.get('id'))
      $('back-link').href = `${home}${back.size ? `?${back}` : ''}`
    }
  }

  function syncFilters() {
    document
      .querySelectorAll('[data-filter]')
      .forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.filter === filter)),
      )
  }

  function renderGallery() {
    visibleItems = items.filter((item) => filter === 'all' || item.type === filter)
    $('gallery-grid').innerHTML = visibleItems
      .map(
        (item) =>
          `<a class="content-card" href="${esc(entryHref(item))}" aria-label="${item.title}，${item.meta}">${cover(item)}<div class="card-caption"><div><h3>${item.title}</h3><p>${item.meta}</p></div><span class="card-arrow" aria-hidden="true">↗</span></div></a>`,
      )
      .join('')
    $('results-status').textContent =
      `${filter === 'all' ? '全部内容' : labels[filter]}，${visibleItems.length} 项`
    syncFilters()
  }

  const compact = window.matchMedia('(max-width: 850px)')
  const preview = $('preview-panel')
  const catalogLayout = document.querySelector('.catalog-layout')

  function positionPreview() {
    if (!preview) return
    const selected = document.querySelector(`[data-entry="${selectedId}"]`)
    const parent = compact.matches && selected && visibleItems.length ? selected : catalogLayout
    if (preview.parentElement !== parent) {
      const focused = preview.contains(document.activeElement) ? document.activeElement : null
      parent.append(preview)
      if (focused && !focused.disabled) focused.focus({ preventScroll: true })
      else if (focused) selected?.querySelector('button').focus({ preventScroll: true })
    }
    document.querySelectorAll('.index-row').forEach((button) => {
      if (compact.matches)
        button.setAttribute('aria-expanded', String(button.dataset.select === selectedId))
      else button.removeAttribute('aria-expanded')
    })
  }

  function selectItem(id, save = true) {
    const item = visibleItems.find((entry) => entry.id === id)
    if (!item) return
    selectedId = item.id
    document
      .querySelectorAll('.index-row')
      .forEach((button) =>
        button.setAttribute('aria-pressed', String(button.dataset.select === id)),
      )
    $('preview-content').innerHTML =
      `<a class="preview-art" href="${esc(entryHref(item))}" aria-label="${item.action}：${item.title}">${cover(item)}</a><div class="preview-copy"><h2>${item.title}</h2><p>${item.meta}</p><a class="text-link" href="${esc(entryHref(item))}">${item.action} <span aria-hidden="true">↗</span></a></div>`
    const position = visibleItems.indexOf(item)
    $('preview-position').textContent = `${two(position + 1)} / ${two(visibleItems.length)}`
    $('preview-prev').disabled = position === 0
    $('preview-next').disabled = position === visibleItems.length - 1
    $('preview-status').textContent = `预览：${item.title}`
    positionPreview()
    if (save) saveBrowseState()
  }

  function renderCatalog(save = false) {
    // Keep the shared preview alive before replacing rows on the compact layout.
    catalogLayout.append(preview)
    visibleItems = items.filter(
      (item) =>
        (filter === 'all' || item.type === filter) &&
        item.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
    )
    $('index-rows').innerHTML = visibleItems
      .map(
        (item) =>
          `<div class="index-item" data-entry="${item.id}"><button class="index-row" data-select="${item.id}" aria-pressed="false" aria-controls="preview-panel"><span class="row-number">${item.number}</span><span class="row-title">${item.title}</span><span class="row-type">${labels[item.type]}</span></button></div>`,
      )
      .join('')
    $('catalog-count').textContent = `${two(visibleItems.length)} 项`
    $('results-status').textContent = `找到 ${visibleItems.length} 项内容`
    $('empty-state').hidden = visibleItems.length > 0
    preview.hidden = visibleItems.length === 0
    if (visibleItems.length)
      selectItem(
        visibleItems.some((item) => item.id === selectedId) ? selectedId : visibleItems[0].id,
        false,
      )
    syncFilters()
    if (save) saveBrowseState()
  }

  function heading(item) {
    return `<header class="entry-heading"><p class="eyebrow">${item.meta}${item.date ? `　/　${item.date}` : ''}</p><h1>${item.title}</h1><p class="lede">${item.summary}</p></header>`
  }

  function renderEntry() {
    const item = items.find((entry) => entry.id === params.get('id'))
    if (!item) {
      $('entry-content').innerHTML =
        '<header class="entry-heading"><h1>没有找到这项内容</h1><p class="lede">可以返回首页，查看其他内容。</p></header>'
      document.title = '未找到内容 — Myshkin 451'
      return
    }
    document.title = `${item.title} — Myshkin 451`
    let body = ''
    if (item.type === 'writing') {
      body = `<div class="reading-layout"><nav class="reading-toc" aria-label="文章目录"><p>本文目录</p>${item.sections.map(([title], i) => `<a href="#section-${i + 1}">${title}</a>`).join('')}</nav><div class="reading-controls" role="group" aria-label="正文字号"><button data-size="normal" aria-pressed="true">标准</button><button data-size="large" aria-pressed="false">大字</button></div><div class="reading-content" id="reading-content">${item.sections.map(([title, ...paragraphs], i) => `<section id="section-${i + 1}"><h2>${title}</h2>${paragraphs.map((text) => `<p>${text}</p>`).join('')}</section>`).join('')}</div></div><div class="entry-end">设计样稿中的${item.id === 'restart' ? '过程记录' : '阅读样文'}<a class="related-link" href="${esc(entryHref(items.find((entry) => entry.id === (item.id === 'restart' ? 'website' : 'restart'))))}">${item.id === 'restart' ? '相关项目：个人网站' : '另一篇：重新做这个网站'} ↗</a></div>`
    } else if (item.type === 'image') {
      body = `<figure class="image-detail"><button id="open-image" class="image-open" aria-label="放大查看${item.title}"><img src="${item.image}" alt="${item.alt}" width="1254" height="1254"></button><figcaption class="image-caption"><span>AI 生成样例，用于页面设计比较。</span><a href="${item.image}" download="${item.id}-sample.png">下载图像 ↗</a></figcaption></figure>`
    } else if (item.id === 'website') {
      body = `<div class="project-showcase">${cover(item)}</div><div class="project-copy"><h2>关于这个项目</h2><div><p>这是当前正在重新设计的个人网站。原有的文章、项目和媒体发布基础保留，这一轮先比较首页与内容页的体验。</p><p>两套样稿使用相同内容。并排版让不同媒介同时出现在页面中；目录版可以先选中一项，再打开详情。正式视觉还没有定稿。</p><div class="project-links"><a class="text-link" href="index.html">查看并排版 ↗</a><a class="text-link" href="catalog.html">查看目录版 ↗</a><a class="text-link" href="https://github.com/myshkin451/myshkin451.com" target="_blank" rel="noopener noreferrer">源代码 ↗</a></div></div></div>`
    } else {
      body = `<section class="palette-tool" aria-label="图像取色工具"><div><div class="color-image"><canvas id="color-canvas" width="960" height="960" tabindex="0" role="button" aria-label="图片取色。点击图片取色，方向键移动取色点，回车复制色值。"></canvas><span id="color-target" class="color-target" aria-hidden="true"></span></div><div class="tool-images" role="group" aria-label="样例图像"><button data-photo="sea" aria-pressed="true">海面</button><button data-photo="path" aria-pressed="false">山路</button></div></div><div class="palette-sidebar"><h2>点击图片取色</h2><p>选取一个位置，复制对应的色值。</p><div id="picked-color" class="picked-color" aria-hidden="true"></div><div class="color-output"><output id="color-value" aria-label="当前色值">载入中</output><button id="copy-color" class="copy-button" disabled>复制色值</button></div><p id="tool-status" class="tool-status" role="status"></p><p class="sample-note">两张图片均为 AI 生成样例。<br>键盘：<kbd>←</kbd> <kbd>↑</kbd> <kbd>↓</kbd> <kbd>→</kbd> 移动取色点，<kbd>Enter</kbd> 复制。</p></div></section>`
    }
    $('entry-content').innerHTML = heading(item) + body
    if (item.type === 'writing') {
      document.querySelectorAll('[data-size]').forEach((button) =>
        button.addEventListener('click', () => {
          $('reading-content').classList.toggle('large-type', button.dataset.size === 'large')
          document
            .querySelectorAll('[data-size]')
            .forEach((option) => option.setAttribute('aria-pressed', String(option === button)))
        }),
      )
    }
    if (item.type === 'image') initImageViewer(item)
    if (item.id === 'palette') initPalette()
  }

  function initImageViewer(initial) {
    const photos = items.filter((item) => item.type === 'image')
    let current = photos.indexOf(initial)
    const dialog = $('image-viewer')
    function showPhoto() {
      const photo = photos[current]
      $('viewer-title').textContent = photo.title
      $('viewer-image').src = photo.image
      $('viewer-image').alt = photo.alt
      $('viewer-position').textContent = `${two(current + 1)} / ${two(photos.length)}`
    }
    function step(direction) {
      current = (current + direction + photos.length) % photos.length
      showPhoto()
    }
    $('open-image').addEventListener('click', () => {
      current = photos.indexOf(initial)
      showPhoto()
      dialog.showModal()
    })
    $('image-prev').addEventListener('click', () => step(-1))
    $('image-next').addEventListener('click', () => step(1))
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        step(event.key === 'ArrowRight' ? 1 : -1)
      }
    })
    dialog.addEventListener('close', () => $('open-image')?.focus())
  }

  function initPalette() {
    const canvas = $('color-canvas')
    const context = canvas.getContext('2d', { willReadFrequently: true })
    const point = { x: 0.52, y: 0.42 }
    let ready = false
    let generation = 0
    let color = ''
    function sample() {
      if (!ready) return
      try {
        const pixel = context.getImageData(
          Math.min(959, Math.floor(point.x * 960)),
          Math.min(959, Math.floor(point.y * 960)),
          1,
          1,
        ).data
        color = `#${Array.from(pixel)
          .slice(0, 3)
          .map((value) => value.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase()}`
        $('color-value').value = color
        $('picked-color').style.backgroundColor = color
        $('color-target').style.left = `${point.x * 100}%`
        $('color-target').style.top = `${point.y * 100}%`
        canvas.setAttribute(
          'aria-label',
          `图片取色，当前 ${color}。方向键移动取色点，回车复制色值。`,
        )
        $('copy-color').disabled = false
      } catch {
        ready = false
        $('copy-color').disabled = true
        $('color-value').value = '无法取色'
        $('tool-status').textContent =
          '请通过本机预览地址打开此工具；直接打开文件时，浏览器可能限制取色。'
      }
    }
    function loadPhoto(id) {
      const request = ++generation
      ready = false
      $('copy-color').disabled = true
      $('tool-status').textContent = '正在载入图像…'
      document
        .querySelectorAll('[data-photo]')
        .forEach((button) =>
          button.setAttribute('aria-pressed', String(button.dataset.photo === id)),
        )
      const image = new Image()
      image.onload = () => {
        if (disposed || request !== generation) return
        if (!context) {
          $('tool-status').textContent = '当前浏览器无法使用图片取色。'
          return
        }
        context.drawImage(image, 0, 0, 960, 960)
        ready = true
        $('tool-status').textContent = ''
        sample()
      }
      image.onerror = () => {
        if (!disposed && request === generation) {
          $('tool-status').textContent = '图像未能载入，请重新选择图片。'
          $('color-value').value = '未载入'
        }
      }
      image.src = items.find((item) => item.id === id).image
    }
    async function copyColor() {
      if (!ready || !color) return
      const value = color
      let copied = false
      try {
        await navigator.clipboard.writeText(value)
        copied = true
      } catch {
        if (disposed) return
        // Local-file browsers may omit the async Clipboard API.
        const previousFocus = document.activeElement
        const field = document.createElement('textarea')
        field.value = value
        field.readOnly = true
        field.style.cssText = 'position:fixed;left:0;top:0;opacity:0;pointer-events:none'
        document.body.append(field)
        field.select()
        try {
          copied = document.execCommand('copy')
        } catch {
          copied = false
        }
        field.remove()
        previousFocus?.focus({ preventScroll: true })
      }
      if (!disposed)
        $('tool-status').textContent = copied ? `已复制 ${value}` : `可手动复制色值：${value}`
    }
    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect()
      point.x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
      point.y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))
      $('tool-status').textContent = ''
      sample()
    })
    canvas.addEventListener('keydown', (event) => {
      const vectors = {
        ArrowLeft: [-0.02, 0],
        ArrowRight: [0.02, 0],
        ArrowUp: [0, -0.02],
        ArrowDown: [0, 0.02],
      }
      if (Object.hasOwn(vectors, event.key)) {
        event.preventDefault()
        point.x = Math.max(0, Math.min(1, point.x + vectors[event.key][0]))
        point.y = Math.max(0, Math.min(1, point.y + vectors[event.key][1]))
        $('tool-status').textContent = ''
        sample()
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        copyColor()
      }
    })
    $('copy-color').addEventListener('click', copyColor)
    document
      .querySelectorAll('[data-photo]')
      .forEach((button) => button.addEventListener('click', () => loadPhoto(button.dataset.photo)))
    loadPhoto('sea')
  }

  applyChrome()
  document.querySelectorAll('[data-filter]').forEach((button) =>
    button.addEventListener('click', () => {
      filter = button.dataset.filter
      if (page === 'gallery') {
        renderGallery()
        saveBrowseState()
      } else renderCatalog(true)
    }),
  )
  if (page === 'gallery') renderGallery()
  if (page === 'catalog') {
    $('search').value = query
    $('search').maxLength = 120
    $('search').addEventListener('input', () => {
      query = $('search').value
      renderCatalog(true)
    })
    $('index-rows').addEventListener('click', (event) => {
      const button = event.target.closest('[data-select]')
      if (button) selectItem(button.dataset.select)
    })
    $('reset-search').addEventListener('click', () => {
      filter = 'all'
      query = ''
      $('search').value = ''
      renderCatalog(true)
      $('search').focus()
    })
    const advance = (direction) => {
      const next =
        visibleItems[visibleItems.findIndex((item) => item.id === selectedId) + direction]
      if (next) selectItem(next.id)
    }
    $('preview-prev').addEventListener('click', () => advance(-1))
    $('preview-next').addEventListener('click', () => advance(1))
    compact.addEventListener('change', positionPreview)
    renderCatalog()
  }
  if (page === 'entry') renderEntry()
  return () => {
    disposed = true
    compact.removeEventListener('change', positionPreview)
  }
}

if (document.body.dataset.page) window.mountStudyPage()
