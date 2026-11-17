import { createContext, useContext, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './OverlayLayer.module.css';

const OverlayContext = createContext<HTMLElement | null>(null);

/**
 * A layer on top of an app, the size of the whole screen. Sheets and context
 * menus are drawn here, so they cover the app (and move with it when it
 * opens and closes) instead of being squeezed into the app's padding.
 */
export function OverlayLayer({ children }: { children: ReactNode }) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  return (
    <OverlayContext.Provider value={host}>
      {children}
      <div ref={setHost} className={styles.layer} />
    </OverlayContext.Provider>
  );
}

/** The nearest overlay layer's element (to measure positions against). */
export function useOverlayHost(): HTMLElement | null {
  return useContext(OverlayContext);
}

/** Draws `children` in the nearest overlay layer (or on the page if there is none). */
export function Overlay({ children }: { children: ReactNode }) {
  const host = useContext(OverlayContext);
  return createPortal(children, host ?? document.body);
}
