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
import { isHosted, onVolumeChord } from './system/nativeBridge';
import { summon } from './vantage/summon';
import { installRoutes } from './system/route';
import { installFpsMeter } from './system/fpsMeter';
import { installNativeApps } from './system/nativeApps';
import { installPhoneControls } from './system/phoneControls';
import { installRealNotifications } from './system/notifications';
import { installAppUpdate } from './system/appUpdate';
import { installTouchScroll } from './system/touchScroll';
import { CrashGuard, installStaleBuildRecovery } from './system/staleBuild';

// A new version replaced this one's files: reload onto it instead of going blank
installStaleBuildRecovery();
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
installAppUpdate();
// Swipes that start on buttons/cards scroll their list too (iOS 16.3 web view)
installTouchScroll();
// Coming back from the Spotify sign-in page: finish connecting
void handleSpotifyRedirect();

// While developing (and on the phone, for `make js` device testing): the actions
// can be run from the console or the test scripts, e.g.
// vantage.runAction('theme.apply', { id: 'ocean' })
if (import.meta.env.DEV || isHosted()) {
  (window as unknown as { vantage: object }).vantage = { runAction, listActions };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Never a blank screen: if the shell itself crashes, offer a reload */}
    <CrashGuard
      fallback={() => (
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ position: 'fixed', inset: 0, border: 0, background: '#000', color: '#fff', font: '600 17px system-ui', padding: 32 }}
        >
          Vantage hit a problem.
          <br />
          Tap to reload.
        </button>
      )}
    >
      <Shell />
    </CrashGuard>
  </StrictMode>,
);
