import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './theme/index.css';
import { Shell } from './shell/Shell';
import { listActions, runAction } from './system/actions';
import { preventZoom } from './system/preventZoom';
import { initSounds } from './system/sounds';
import { handleSpotifyRedirect } from './system/spotify';
import { initTheme } from './system/theme';
import { onEasterEgg } from './system/easterEgg';
import { onVolumeChord } from './system/nativeBridge';
import { summon } from './vantage/summon';
import { installRoutes } from './system/route';
import { installFpsMeter } from './system/fpsMeter';
import { installNativeApps } from './system/nativeApps';
import { installPhoneControls } from './system/phoneControls';
import { installRealNotifications } from './system/notifications';

preventZoom();
// Battery: CSS animations pause while the app is in the background (see global.css)
document.addEventListener('visibilitychange', () => document.documentElement.toggleAttribute('data-hidden', document.visibilityState === 'hidden'));
initSounds();
initTheme();
onEasterEgg(() => void runAction('easter.gameboy', {}));
// After the jailbreak: volume up + down summons Vantage (does nothing before)
onVolumeChord(() => summon('volume-chord'));
// Routes: ?route=app/clock/timer, window.vantageGo(...), `make route` on the phone
installRoutes();
// Host mode: the phone's real apps (cached now, refreshed from SpringBoard)
installNativeApps();
// Host mode: the phone's real controls (Wi-Fi, brightness, now playing...)
installPhoneControls();
// Host mode: real notifications from every app
installRealNotifications();
// Hidden FPS meter (?fps=1, `make fps` on the phone): frame times to the log
installFpsMeter();
// Coming back from the Spotify sign-in page: finish connecting
void handleSpotifyRedirect();

// While developing: the actions can be run from the browser console or by the
// screenshot scripts, e.g. vantage.runAction('theme.apply', { id: 'ocean' })
if (import.meta.env.DEV) {
  (window as unknown as { vantage: object }).vantage = { runAction, listActions };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Shell />
  </StrictMode>,
);
