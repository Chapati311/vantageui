import { useRef, useState, type ComponentType } from 'react';
import { FlashlightIcon } from '../../components/glyphs';
import { CameraIcon } from '../../system/appIcons';
import { runAction } from '../../system/actions';
import { useSetting } from '../../system/settingsStore';
import { playSound } from '../../system/sounds';
import styles from './Lock.module.css';

/** How long you hold before it works (so it never fires from a pocket). */
const HOLD_MS = 500;

/** A round button that only works when held: a ring fills while you hold. */
function HoldButton({ label, icon: Glyph, on, onHold }: { label: string; icon: ComponentType; on?: boolean; onHold: () => void }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef(0);
  const stop = () => {
    window.clearTimeout(timer.current);
    setHolding(false);
  };

  return (
    <button
      type="button"
      className={`${styles.shortcut} ${holding ? styles.holding : ''} ${on ? styles.shortcutOn : ''}`}
      aria-label={`${label} (hold)`}
      aria-pressed={on}
      onPointerDown={(event) => {
        event.stopPropagation();
        setHolding(true);
        timer.current = window.setTimeout(() => {
          setHolding(false);
          navigator.vibrate?.(15);
          playSound('toggleOn');
          onHold();
        }, HOLD_MS);
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(event) => event.preventDefault()}
    >
      <svg className={styles.holdRing} viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="48" pathLength={1} />
      </svg>
      <Glyph />
    </button>
  );
}

/** Flashlight on the left, camera on the right, at the bottom of the lock screen. */
export function LockShortcuts() {
  const [enabled] = useSetting('lockShortcuts');
  const [flashlight] = useSetting('flashlight');
  if (!enabled) return null;
  return (
    <>
      <div className={styles.shortcutLeft}>
        <HoldButton label="Flashlight" icon={FlashlightIcon} on={flashlight} onHold={() => void runAction('device.flashlight', {})} />
      </div>
      <div className={styles.shortcutRight}>
        <HoldButton
          label="Camera"
          icon={CameraIcon}
          onHold={() => {
            void runAction('shell.unlock', {});
            void runAction('app.open', { appId: 'camera' });
          }}
        />
      </div>
    </>
  );
}
