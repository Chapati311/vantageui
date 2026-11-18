import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { blockState, emergencyUnlock } from '../apps/lockin/blocking';
import { getLockIn } from '../apps/lockin/lockInStore';
import { Button } from '../components/kit';
import { runAction } from '../system/actions';
import { getApp } from '../system/appRegistry';
import { SPRING } from '../theme/tokens';
import styles from './LockedApp.module.css';

const time = (ms: number) => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/**
 * The calm screen you see when you open a locked app: what you are locked
 * in for, when it opens again, back to focus. Emergency unlock: wait 60
 * seconds and say why (not in strict mode).
 */
export function LockedApp({ appId, onClose }: { appId: string | null; onClose: () => void }) {
  return <AnimatePresence>{appId && <Locked key={appId} appId={appId} onClose={onClose} />}</AnimatePresence>;
}

function Locked({ appId, onClose }: { appId: string; onClose: () => void }) {
  const state = blockState(appId);
  const app = getApp(appId);
  const strict = getLockIn().blocking.strict;
  const [askedAt, setAskedAt] = useState<number | null>(null);
  const [why, setWhy] = useState('');
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (askedAt === null) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [askedAt]);

  const wait = askedAt !== null ? Math.max(0, 60 - Math.floor((now - askedAt) / 1000)) : null;

  return (
    <motion.div className={styles.screen} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={SPRING.ui} role="dialog" aria-label={`${app?.name} is locked`}>
      <span className="label">{app?.name} is locked</span>
      <h1 className={styles.title}>{state.reason || 'Locked'}</h1>
      {state.until && <p className={styles.text}>Opens again at {time(state.until)}.</p>}
      <Button
        kind="primary"
        onPress={() => {
          onClose();
          void runAction('app.open', { appId: 'lockin' });
        }}
      >
        Back to focus
      </Button>
      <Button onPress={onClose}>Not now</Button>
      {!strict &&
        (wait === null ? (
          <button type="button" className={styles.emergency} onClick={() => setAskedAt(Date.now())}>
            Emergency unlock
          </button>
        ) : (
          <div className={styles.ask}>
            <input className={styles.input} placeholder="Why do you need it?" aria-label="Why do you need it" value={why} onChange={(e) => setWhy(e.target.value)} />
            <Button
              kind="destructive"
              disabled={wait > 0 || why.trim().length < 3}
              onPress={() => {
                emergencyUnlock(appId);
                onClose();
                void runAction('app.open', { appId });
              }}
            >
              {wait > 0 ? `Wait ${wait} s` : 'Open for 10 minutes'}
            </Button>
          </div>
        ))}
    </motion.div>
  );
}
