import { useEffect, useRef } from 'react';
import { runAction } from '../system/actions';
import { FRAME_URL, IS_MOCK, attachFrame, onVantageClose } from './bridge';
import styles from './VantageApp.module.css';

/**
 * The Vantage app, full screen inside the OS app frame (so the zoom from the
 * icon, the status bar and the home gesture still belong to the OS). Vantage
 * itself is a separate web app, loaded from /vantage/ on this same domain.
 */
export function VantageApp() {
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    attachFrame('app', frame.current?.contentWindow ?? null);
    onVantageClose((mode) => mode === 'app' && void runAction('app.close', {}));
    return () => attachFrame('app', null);
  }, []);

  return (
    <div className={styles.app}>
      <iframe
        ref={frame}
        className={styles.frame}
        src={`${FRAME_URL}${FRAME_URL.includes('?') ? '&' : '?'}host=vantage-os`}
        title={IS_MOCK ? 'Vantage (test page)' : 'Vantage'}
        allow="microphone; autoplay; clipboard-write"
      />
    </div>
  );
}
