import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './theme/index.css';
import { Shell } from './shell/Shell';
import { preventZoom } from './system/preventZoom';
import { initSounds } from './system/sounds';

preventZoom();
initSounds();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Shell />
  </StrictMode>,
);
