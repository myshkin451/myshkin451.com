import { useEffect, useRef } from 'react'
import { useConfirm } from './Confirm'

export function useUnsavedWork(dirty: boolean) {
  const confirm = useConfirm()
  const allowNext = useRef(false)
  const allowUnload = useRef(false)
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  useEffect(() => {
    if (!dirty) return
    const previousUrl = window.location.href
    let deciding = false
    const confirmLeave = async (resume: () => void) => {
      if (deciding) return
      deciding = true
      const accepted = await confirm({
        title: '离开编辑器？',
        description: '还有未保存的修改。离开后，这些修改不会保留。',
        confirmLabel: '放弃修改并离开',
        cancelLabel: '继续编辑',
        danger: true,
      })
      deciding = false
      if (mounted.current && accepted) resume()
    }
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (allowUnload.current) {
        allowUnload.current = false
        return
      }
      event.preventDefault()
      event.returnValue = ''
    }
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]')
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const target = new URL(anchor.href, window.location.href)
      if (target.href === window.location.href) {
        // A repeated path link can reload the document and discard the current edit.
        event.preventDefault()
        event.stopImmediatePropagation()
        return
      }
      const current = new URL(window.location.href)
      const sameDocument =
        target.origin === current.origin &&
        target.pathname === current.pathname &&
        target.search === current.search
      if (sameDocument && target.hash && !target.hash.startsWith('#/')) return
      // Stop both the browser default and any React router handler before awaiting a decision.
      event.preventDefault()
      event.stopImmediatePropagation()
      void confirmLeave(() => {
        if (sameDocument) {
          allowNext.current = true
          window.location.hash = target.hash
        } else {
          allowUnload.current = true
          window.location.assign(target.href)
          // Non-document protocols may not unload the page; do not leave its close guard disabled.
          window.setTimeout(() => {
            allowUnload.current = false
          }, 0)
        }
      })
    }
    const onHashChange = (event: HashChangeEvent) => {
      if (allowNext.current) {
        allowNext.current = false
        return
      }
      const target = new URL(event.newURL)
      window.history.replaceState(null, '', previousUrl)
      event.stopImmediatePropagation()
      void confirmLeave(() => {
        allowNext.current = true
        window.location.hash = target.hash
      })
    }
    document.addEventListener('click', onClick, true)
    window.addEventListener('hashchange', onHashChange, true)
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('hashchange', onHashChange, true)
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [confirm, dirty])
  return (leavingDocument = false) => {
    allowNext.current = true
    allowUnload.current = leavingDocument
  }
}
