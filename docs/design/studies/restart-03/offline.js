;(() => {
  'use strict'

  const bundle = JSON.parse(document.getElementById('offline-data').textContent)
  const app = document.getElementById('offline-app')
  const conceptDialog = document.getElementById('offline-concept')
  const conceptImage = document.getElementById('offline-concept-image')
  let disposePage = null
  let activePage = 'index.html'
  const stateReplacements = new Map()

  window.studyAsset = (path) => bundle.assets[path] || path

  function rewriteLinks() {
    app.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href')
      if (Object.hasOwn(bundle.pages, href.split('?')[0])) {
        link.dataset.offlineHref = href
        link.setAttribute('href', `#/${href}`)
      }
    })
  }

  function route() {
    const raw = window.location.hash.startsWith('#/') ? window.location.hash.slice(2) : 'index.html'
    const [path, ...query] = raw.split('?')
    const name = Object.hasOwn(bundle.pages, path) ? path : 'index.html'
    return { name, search: name === path ? query.join('?') : '' }
  }

  function render() {
    disposePage?.()
    if (conceptDialog.open) conceptDialog.close()
    const current = route()
    const page = bundle.pages[current.name]
    activePage = current.name
    app.innerHTML = page.body
    document.body.dataset.page = page.page
    document.body.className = page.theme
    document.title = page.title
    window.studyNavigation = {
      search: current.search,
      replace(search) {
        // Only the fragment changes, including when the file is opened directly.
        const target = `#/${activePage}${search ? `?${search}` : ''}`
        if (window.location.hash === target) return
        try {
          window.history.replaceState(null, '', target)
        } catch {
          // Some file-origin implementations reject History API writes.
          // A fragment replacement preserves the file and the active input.
          const hash = new URL(target, window.location.href).hash
          stateReplacements.set(hash, (stateReplacements.get(hash) || 0) + 1)
          window.location.replace(target)
        }
      },
    }
    disposePage = window.mountStudyPage()
    rewriteLinks()
    window.scrollTo({ top: 0, behavior: 'instant' })
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a')
    if (!link || event.defaultPrevented || event.button !== 0) return
    const href = link.dataset.offlineHref || link.getAttribute('href') || ''
    const name = href.split('?')[0]
    if (Object.hasOwn(bundle.pages, name)) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      const target = `#/${href}`
      if (window.location.hash === target) {
        render()
      } else {
        window.location.hash = target
      }
    } else if (Object.hasOwn(bundle.assets, href) && href.startsWith('concept-')) {
      event.preventDefault()
      conceptImage.src = bundle.assets[href]
      conceptImage.alt = href.includes('catalog') ? '目录版效果图' : '并排版效果图'
      document.getElementById('offline-concept-title').textContent = conceptImage.alt
      conceptDialog.showModal()
    } else if (href.startsWith('#') && !href.startsWith('#/')) {
      const target = document.getElementById(href.slice(1))
      if (target) {
        event.preventDefault()
        target.scrollIntoView({ block: 'start' })
        if (target.id === 'main') {
          target.setAttribute('tabindex', '-1')
          target.focus({ preventScroll: true })
        }
      }
    }
  })

  window.addEventListener('hashchange', (event) => {
    const hash = new URL(event.newURL).hash
    const pending = stateReplacements.get(hash) || 0
    if (pending) {
      if (pending === 1) stateReplacements.delete(hash)
      else stateReplacements.set(hash, pending - 1)
      return
    }
    render()
  })
  new MutationObserver(rewriteLinks).observe(app, { childList: true, subtree: true })
  render()
})()
