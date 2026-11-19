import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { DotNumber } from '../../components/DotNumber';
import { useBattery } from '../../system/useBattery';
import { SPRING } from '../../theme/tokens';
import styles from './Lock.module.css';

const DOTS = 36;

/**
 * Plugging in: a ring of dots fills up to the battery level in a wave,
 * with the percent in the middle, then fades after a few seconds.
 */
export function ChargingOverlay({ active }: { active: boolean }) {
  const battery = useBattery();
  const [show, setShow] = useState(false);
  const wasCharging = useRef<boolean | null>(null);

  useEffect(() => {
    const charging = battery?.charging ?? false;
    // Only on the moment it starts charging (not when the page loads already charging)
    if (wasCharging.current === false && charging && active) {
      setShow(true);
      const timer = window.setTimeout(() => setShow(false), 3200);
      wasCharging.current = charging;
      return () => window.clearTimeout(timer);
    }
    wasCharging.current = charging;
  }, [battery?.charging, active]);

  const level = battery?.level ?? 0;
  const lit = Math.round(level * DOTS);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className={styles.charging}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={SPRING.ui}
          aria-live="polite"
          aria-label={`Charging, ${Math.round(level * 100)} percent`}
        >
          <div className={styles.chargeRing}>
            {Array.from({ length: DOTS }, (_, index) => {
              const angle = (index / DOTS) * Math.PI * 2 - Math.PI / 2;
              return (
                <span
                  key={index}
                  className={`${styles.chargeDot} ${index < lit ? styles.chargeLit : ''}`}
                  style={{
                    left: `${50 + Math.cos(angle) * 46}%`,
                    top: `${50 + Math.sin(angle) * 46}%`,
                    animationDelay: `${index * 28}ms`,
                  }}
                />
              );
            })}
            <DotNumber value={String(Math.round(level * 100))} size={40} narrowOne />
          </div>
          <span className="label">Charging</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
