/**
 * Routes: a short text that names a screen, so tools (and links) can open
 * any screen directly. Used by `?route=...` in the address, by
 * `window.vantageGo(route)`, and on the phone by `make route` / `make tour`
 * in vantage-tweak.
 *
 *   home/1, home/2 ...        home screen page (1 = first)
 *   today                     the Today view (left of page 1)
 *   app/<id>[/<sub>]          open an app; sub = Clock tab or Customise page
 *                             (app/clock/timer, app/customise/themes)
 *   customise/<page>          same as app/customise/<page>
 *   lock | unlock | controls | notifications | search | switcher
 */
import { runAction } from './actions';
import { setCustomiseSection } from '../apps/customise/customiseNav';

const CLOCK_TABS = ['alarm', 'world', 'stopwatch', 'timer'] as const;
const pause = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/** Opens the screen a route names. Unknown routes are reported, never guessed. */
export async function goToRoute(route: string): Promise<boolean> {
  const [first, second, third] = route.trim().replace(/^\/+|\/+$/g, '').split('/');
  // Start from a clean home screen (no app, no overlays) every time.
  await runAction('shell.closeOverlays', {});
  await runAction('app.close', {});
  await pause(350);

  switch (first) {
    case 'home': {
      const page = Math.max(1, Number(second) || 1) - 1;
      window.dispatchEvent(new CustomEvent('vantage:home-page', { detail: { page } }));
      return true;
    }
    case 'today':
      window.dispatchEvent(new CustomEvent('vantage:home-page', { detail: { page: -1 } }));
      return true;
    case 'customise':
      return openApp('customise', second);
    case 'app':
      return second ? openApp(second, third) : false;
    case 'lock':
      await runAction('shell.lock', {});
      return true;
    case 'unlock':
      await runAction('shell.unlock', {});
      return true;
    case 'controls':
      await runAction('shell.openControlCenter', {});
      return true;
    case 'notifications':
      await runAction('shell.openNotifications', {});
      return true;
    case 'search':
      await runAction('shell.openSearch', {});
      return true;
    case 'switcher':
      await runAction('shell.openAppSwitcher', {});
      return true;
    default:
      console.warn(`[vantage] unknown route "${route}"`);
      return false;
  }
}

async function openApp(appId: string, sub?: string): Promise<boolean> {
  if (appId === 'customise') setCustomiseSection(sub ?? null);
  await runAction('app.open', { appId });
  if (appId === 'clock' && sub && (CLOCK_TABS as readonly string[]).includes(sub)) {
    await runAction('clock.showTab', { tab: sub as (typeof CLOCK_TABS)[number] });
  }
  return true;
}

declare global {
  interface Window {
    /** Open a screen by route (see route.ts). */
    vantageGo?: (route: string) => Promise<boolean>;
  }
}

/** Installs window.vantageGo and follows ?route= once the shell is ready. */
export function installRoutes(): void {
  window.vantageGo = goToRoute;
  const route = new URLSearchParams(window.location.search).get('route');
  if (route) window.setTimeout(() => void goToRoute(route), 1200);
}
