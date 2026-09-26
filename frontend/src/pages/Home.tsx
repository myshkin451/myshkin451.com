import { usePlatform } from '../platform'
import { HomePresentation } from '../modern/HomePresentation'

export function Home({ onVisit }: { onVisit: () => void }) {
  const { state, entries } = usePlatform()
  return <HomePresentation entries={entries} settings={state.settings} onVisit={onVisit} />
}
