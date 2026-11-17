import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './theme/index.css';
import { Shell } from './shell/Shell';
import { listActions, runAction } from './system/actions';
import { preventZoom } from './system/preventZoom';
import { initSounds } from './system/sounds';
import { initTheme } from './system/theme';

preventZoom();
initSounds();
initTheme();

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
