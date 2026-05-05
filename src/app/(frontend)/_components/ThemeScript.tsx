import { defaultThemeMode, themeStorageKey } from '../_lib/theme'

const themeScript = `
(function () {
  var root = document.documentElement;
  var storageKey = ${JSON.stringify(themeStorageKey)};
  var fallbackMode = ${JSON.stringify(defaultThemeMode)};

  function isThemeMode(value) {
    return value === 'system' || value === 'dark' || value === 'light';
  }

  function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  try {
    var storedMode = window.localStorage.getItem(storageKey);
    var mode = isThemeMode(storedMode) ? storedMode : fallbackMode;
    root.dataset.themeMode = mode;
    root.dataset.theme = mode === 'system' ? getSystemTheme() : mode;
  } catch (error) {
    root.dataset.themeMode = fallbackMode;
    root.dataset.theme = getSystemTheme();
  }
})();
`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: themeScript }} />
}
