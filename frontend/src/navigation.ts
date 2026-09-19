import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}
export function useRoute() {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => '#/',
  )
  const [path, query = ''] = (hash.startsWith('#/') ? hash.slice(1) : '/').split('?')
  return { path, params: new URLSearchParams(query) }
}
export function go(path: string) {
  window.location.hash = path.startsWith('/') ? path : '/'
}
