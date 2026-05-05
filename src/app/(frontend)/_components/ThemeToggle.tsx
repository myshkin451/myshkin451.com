'use client'

import { useEffect, useSyncExternalStore } from 'react'

import { defaultThemeMode, isThemeMode, resolveThemeMode, themeStorageKey } from '../_lib/theme'
import type { ThemeMode } from '../_lib/theme'
import { uiCopy } from '../_lib/uiCopy'

const themeChangeEvent = 'myshkin451-theme-change'

function getSystemPrefersDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyThemeMode(mode: ThemeMode) {
  const root = document.documentElement
  const resolvedTheme = resolveThemeMode(mode, getSystemPrefersDark())

  root.dataset.themeMode = mode
  root.dataset.theme = resolvedTheme
}

function getStoredThemeMode() {
  const storedMode = window.localStorage.getItem(themeStorageKey)

  return isThemeMode(storedMode) ? storedMode : defaultThemeMode
}

function getThemeSnapshot() {
  if (typeof window === 'undefined') {
    return defaultThemeMode
  }

  const currentMode = document.documentElement.dataset.themeMode

  return isThemeMode(currentMode ?? null) ? currentMode : getStoredThemeMode()
}

function subscribeToThemeChanges(onChange: () => void) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const syncTheme = () => {
    const currentMode = getStoredThemeMode()

    if (currentMode === 'system') {
      applyThemeMode(currentMode)
    }

    onChange()
  }

  window.addEventListener('storage', syncTheme)
  window.addEventListener(themeChangeEvent, syncTheme)
  mediaQuery.addEventListener('change', syncTheme)

  return () => {
    window.removeEventListener('storage', syncTheme)
    window.removeEventListener(themeChangeEvent, syncTheme)
    mediaQuery.removeEventListener('change', syncTheme)
  }
}

export function ThemeToggle() {
  const mode = useSyncExternalStore(
    subscribeToThemeChanges,
    getThemeSnapshot,
    () => defaultThemeMode,
  )

  useEffect(() => {
    applyThemeMode(getStoredThemeMode())
  }, [])

  const chooseTheme = (nextMode: ThemeMode) => {
    window.localStorage.setItem(themeStorageKey, nextMode)
    applyThemeMode(nextMode)
    window.dispatchEvent(new Event(themeChangeEvent))
  }

  return (
    <div aria-label={uiCopy.theme.ariaLabel} className="theme-toggle" role="group">
      {uiCopy.theme.options.map((option) => (
        <button
          aria-label={option.ariaLabel}
          aria-pressed={mode === option.id}
          className="theme-toggle__option"
          key={option.id}
          onClick={() => chooseTheme(option.id)}
          title={option.description}
          type="button"
        >
          <span aria-hidden="true">{option.shortLabel}</span>
        </button>
      ))}
    </div>
  )
}
