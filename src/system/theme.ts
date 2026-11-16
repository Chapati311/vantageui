import { getSettings, subscribeToSettings } from './settingsStore';

/** Switches the whole OS between dark and light by setting data-theme on <html>. */
function apply(): void {
  const light = getSettings().lightMode;
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  // Keeps the browser's own chrome (when there is any) in the same color.
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', light ? '#edeef0' : '#06090d');
}

/** Call once at startup. Re-applies whenever the setting changes. */
export function initTheme(): void {
  apply();
  subscribeToSettings(apply);
}
