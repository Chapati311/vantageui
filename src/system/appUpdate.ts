/**
 * Keeps the phone on the latest Vantage OS (DEVICE_QA: the phone ran a days-old
 * build). On the phone the page stays open for days as the home screen, so a
 * new version the service worker downloaded never ran. Now: look for an
 * update whenever Vantage comes back to the front (at most every 10 minutes),
 * and once a new version has taken over, reload quietly while Vantage is in
 * the background (you're in another app), coming back to the same screen.
 */
import { isHosted } from './nativeBridge';

const CHECK_EVERY_MS = 10 * 60_000;

export function installAppUpdate(): void {
  if (!('serviceWorker' in navigator) || !isHosted()) return;
  let lastCheck = 0;
  let pending = false;
  /** The live site serves a different build: drop the offline copy before reloading */
  let dropOfflineCopy = false;
  /** A page without a service worker gets one on its first visit: that is not an update */
  let hadController = Boolean(navigator.serviceWorker.controller);
  /** The build the live site serves right now, vs. the one running here. */
  const running = () => [...document.scripts].map((s) => s.src).find((src) => /\/assets\/index-/.test(src)) ?? '';
  const live = async () => {
    const html = await (await fetch(`/?v=${Date.now()}`, { cache: 'no-store' })).text();
    return html.match(/\/assets\/index-[^"']+\.js/)?.[0] ?? '';
  };
  const check = () => {
    if (Date.now() - lastCheck < CHECK_EVERY_MS) return;
    lastCheck = Date.now();
    void navigator.serviceWorker.getRegistration().then((registration) => registration?.update()).catch(() => {});
    // The service worker didn't always switch to a new build on the phone: compare
    // with what the site serves, and if it's newer, drop the offline copy and reload
    void live()
      .then((latest) => {
        if (!latest || running().endsWith(latest)) return;
        // Only marked here: the offline copy is dropped right before the reload.
        // Dropping it now broke opening apps (their code was gone: blank screen).
        pending = true;
        dropOfflineCopy = true;
      })
      .catch(() => {});
  };
  const reloadNow = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('restore', '1');
    const go = () => window.location.replace(url.toString());
    if (!dropOfflineCopy) return go();
    // Drop the old offline copy first (at most 2 s), so the new version loads
    void Promise.race([
      Promise.all([
        navigator.serviceWorker.getRegistrations().then((list) => Promise.all(list.map((r) => r.unregister()))),
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))),
      ]),
      new Promise((resolve) => window.setTimeout(resolve, 2000)),
    ])
      .catch(() => {})
      .then(go);
  };
  // A new service worker took control: the new code is ready.
  // (Not the first one a fresh page gets: treating that as an update reloaded
  // Vantage again and again in the background, found on the phone 2026-11-26.)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    if (document.visibilityState === 'hidden') reloadNow();
    else pending = true;
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && pending) reloadNow();
    if (document.visibilityState === 'visible') check();
  });
  check();
}
