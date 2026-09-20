'use client'
import App from '../../frontend/src/App'
import { PlatformProvider } from '../../frontend/src/platform'
import { NavigationProvider } from '../../frontend/src/navigation'
import { ConfirmProvider } from '../../frontend/src/Confirm'
import type { StoredState } from '../../frontend/src/types'

type Config = { url: string; key: string; emailEnabled: boolean; githubEnabled: boolean }
export function Site({
  state,
  config,
  route,
}: {
  state: StoredState
  config: Config
  route: string
}) {
  return (
    <NavigationProvider route={route}>
      <PlatformProvider remote={config} initialState={state}>
        <ConfirmProvider>
          <App />
        </ConfirmProvider>
      </PlatformProvider>
    </NavigationProvider>
  )
}
