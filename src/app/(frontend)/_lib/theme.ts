export const defaultThemeMode = 'system'
export const themeStorageKey = 'myshkin451.theme'
export const themeModes = ['system', 'dark', 'light'] as const

export type ResolvedTheme = 'dark' | 'light'
export type ThemeMode = (typeof themeModes)[number]

export function isThemeMode(value: string | null): value is ThemeMode {
  return themeModes.includes(value as ThemeMode)
}

export function resolveThemeMode(mode: ThemeMode, prefersDark: boolean): ResolvedTheme {
  if (mode === 'system') {
    return prefersDark ? 'dark' : 'light'
  }

  return mode
}
