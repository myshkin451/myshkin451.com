import {
  createContext,
  useContext,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type ReactNode,
} from 'react'

const NavigationContext = createContext<string | null>(null)

export function NavigationProvider({ route, children }: { route: string; children: ReactNode }) {
  return <NavigationContext.Provider value={route}>{children}</NavigationContext.Provider>
}

function pathRouting() {
  return typeof document !== 'undefined' && document.body.dataset.routing === 'path'
}

export function currentRoute() {
  return pathRouting()
    ? window.location.pathname + window.location.search
    : window.location.hash.slice(1) || '/'
}

function subscribe(callback: () => void) {
  window.addEventListener('hashchange', callback)
  window.addEventListener('popstate', callback)
  return () => {
    window.removeEventListener('hashchange', callback)
    window.removeEventListener('popstate', callback)
  }
}

export function useRoute() {
  const initialRoute = useContext(NavigationContext)
  const route = useSyncExternalStore(subscribe, currentRoute, () => initialRoute || '/')
  const [path, query = ''] = route.split('?')
  return { path, params: new URLSearchParams(query) }
}

export function SiteLink({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const production = useContext(NavigationContext) !== null
  return <a {...props} href={production && href?.startsWith('#/') ? href.slice(1) : href} />
}

export function go(path: string) {
  const safe = path.startsWith('/') && !path.startsWith('//') && !/[\\\r\n]/.test(path) ? path : '/'
  if (pathRouting()) window.location.assign(safe)
  else window.location.hash = safe
}

export function replaceRoute(path: string) {
  window.history.replaceState(null, '', pathRouting() ? path : `#${path}`)
  window.dispatchEvent(new Event('popstate'))
}
