import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './theme/index.css';
import { Shell } from './shell/Shell';
import { preventZoom } from './system/preventZoom';
import { initSounds } from './system/sounds';
import { initTheme } from './system/theme';

preventZoom();
initSounds();
initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Shell />
  </StrictMode>,
);
