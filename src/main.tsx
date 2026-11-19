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

preventZoom();
initSounds();
initTheme();
onEasterEgg(() => void runAction('easter.gameboy', {}));
// After the jailbreak: volume up + down summons Vantage (does nothing before)
onVolumeChord(() => summon('volume-chord'));
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
