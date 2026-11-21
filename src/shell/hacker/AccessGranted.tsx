import { useEffect, useState } from 'react';
import { useSetting } from '../../system/settingsStore';
import { playSound } from '../../system/sounds';
import styles from './AccessGranted.module.css';

const LINES = ['> touch id ........ ok', '> keychain ........ ok', '> session ......... root@vantage'];

/**
 * Hacker mode: right after unlocking, a short "ACCESS GRANTED" (about 0.9 s,
 * then it fades away). Settings: Customise > Modes > Access granted.
 * `trigger` changes on every unlock.
 */
export function AccessGranted({ trigger }: { trigger: number }) {
  const [mode] = useSetting('mode');
  const [enabled] = useSetting('accessGranted');
  const [shown, setShown] = useState(false);
  const [typed, setTyped] = useState(0);
  useEffect(() => {
    if (!trigger || mode !== 'hacker' || !enabled) return;
    setShown(true);
    setTyped(0);
    playSound('toggleOn');
    const timers = [
      ...LINES.map((_, i) => window.setTimeout(() => setTyped(i + 1), 110 * (i + 1))),
      window.setTimeout(() => setTyped(LINES.length + 1), 420),
      window.setTimeout(() => setShown(false), 950),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [trigger]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!shown) return null;
  return (
    <div className={styles.layer} aria-live="polite">
      <div className={styles.lines}>
        {LINES.slice(0, typed).map((line) => (
          <div key={line}>{line}</div>
        ))}
        {typed > LINES.length && <div className={styles.granted}>ACCESS GRANTED</div>}
      </div>
    </div>
  );
}
