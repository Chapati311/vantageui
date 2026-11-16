import { getSettings, subscribeToSettings } from './settingsStore';

/**
 * Applies the look settings to the whole OS by setting attributes on <html>:
 * data-theme (dark / light) and data-accent (mint, amber, ...).
 * The matching colors are defined in theme/theme.css.
 */
function apply(): void {
  const { lightMode, accent } = getSettings();
  document.documentElement.dataset.theme = lightMode ? 'light' : 'dark';
  document.documentElement.dataset.accent = accent;
  // Keeps the browser's own chrome (when there is any) in the same color.
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', lightMode ? '#edeef0' : '#06090d');
}

/** Call once at startup. Re-applies whenever a setting changes. */
export function initTheme(): void {
  apply();
  subscribeToSettings(apply);
}
