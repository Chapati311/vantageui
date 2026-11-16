import { useState } from 'react';
import { HomeScreen } from './HomeScreen';
import { LockScreen } from './LockScreen';
import styles from './Shell.module.css';

/** The OS frame: the home screen with the lock screen layered on top. */
export function Shell() {
  const [locked, setLocked] = useState(true);

  return (
    <div className={styles.shell}>
      <HomeScreen />
      <LockScreen locked={locked} onUnlock={() => setLocked(false)} />
    </div>
  );
}
