import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';
import { DotNumber } from '../components/DotNumber';
import { BackIcon } from '../components/glyphs';
import { Pressable } from '../components/Pressable';
import { PASSCODE_LENGTH, checkPasscode } from '../system/passcode';
import { playSound } from '../system/sounds';
import { SPRING } from '../theme/tokens';
import styles from './PasscodeScreen.module.css';

interface PasscodeScreenProps {
  open: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

/** After this many wrong tries, wait before trying again. */
const TRIES_BEFORE_WAIT = 5;
const WAIT_SECONDS = 30;

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'cancel', '0', 'delete'] as const;

/**
 * Shown after the unlock swipe when a passcode is set: six dots and a
 * keypad of dot-matrix digits. A wrong code shakes the dots.
 */
export function PasscodeScreen({ open, onSuccess, onCancel }: PasscodeScreenProps) {
  return (
    <AnimatePresence>
      {open && <Pad key="pad" onSuccess={onSuccess} onCancel={onCancel} />}
    </AnimatePresence>
  );
}

function Pad({ onSuccess, onCancel }: Omit<PasscodeScreenProps, 'open'>) {
  const [code, setCode] = useState('');
  const [wrongTries, setWrongTries] = useState(0);
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(Date.now);
  const [dots, animateDots] = useAnimate();
  const waiting = waitUntil > now;

  // Count down while waiting after too many wrong tries
  useEffect(() => {
    if (!waiting) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [waiting]);

  const press = useCallback(
    (key: (typeof KEYS)[number]) => {
      if (key === 'cancel') return onCancel();
      if (key === 'delete') return setCode(code.slice(0, -1));
      if (waitUntil > Date.now() || code.length >= PASSCODE_LENGTH) return;
      playSound('tick');
      const next = code + key;
      setCode(next);
      if (next.length < PASSCODE_LENGTH) return;
      if (checkPasscode(next)) {
        playSound('unlock');
        onSuccess();
        return;
      }
      // Wrong: shake the dots, then start over
      void animateDots(dots.current, { x: [0, -16, 16, -12, 12, -6, 6, 0] }, { duration: 0.4 });
      navigator.vibrate?.([30, 40, 30]);
      const tries = wrongTries + 1;
      setWrongTries(tries);
      if (tries % TRIES_BEFORE_WAIT === 0) {
        setWaitUntil(Date.now() + WAIT_SECONDS * 1000);
        setNow(Date.now());
      }
      window.setTimeout(() => setCode(''), 400);
    },
    [animateDots, code, dots, onCancel, onSuccess, waitUntil, wrongTries],
  );

  // Typing on a keyboard works too (handy when testing on a computer)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (/^\d$/.test(event.key)) press(event.key as (typeof KEYS)[number]);
      else if (event.key === 'Backspace') press('delete');
      else if (event.key === 'Escape') press('cancel');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  const message = waiting
    ? `Try again in ${Math.ceil((waitUntil - now) / 1000)} s`
    : wrongTries > 0
      ? 'Wrong passcode'
      : 'Enter passcode';

  return (
    <motion.div
      className={styles.screen}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={SPRING.ui}
      role="dialog"
      aria-label="Enter passcode"
    >
      <p className={`label ${styles.message}`} aria-live="polite">
        {message}
      </p>
      <div ref={dots} className={styles.dots} aria-label={`${code.length} of ${PASSCODE_LENGTH} digits entered`}>
        {Array.from({ length: PASSCODE_LENGTH }, (_, index) => (
          <span key={index} className={`${styles.dot} ${index < code.length ? styles.filled : ''}`} />
        ))}
      </div>
      <div className={`${styles.keypad} ${waiting ? styles.waiting : ''}`}>
        {KEYS.map((key) =>
          key === 'cancel' ? (
            <Pressable key={key} className={styles.textKey} onClick={() => press(key)}>
              Cancel
            </Pressable>
          ) : key === 'delete' ? (
            <Pressable key={key} className={styles.textKey} aria-label="Delete" onClick={() => press(key)} disabled={!code}>
              <BackIcon />
            </Pressable>
          ) : (
            <Pressable key={key} className={styles.key} aria-label={key} onClick={() => press(key)}>
              <DotNumber value={key} size={28} instant />
            </Pressable>
          ),
        )}
      </div>
    </motion.div>
  );
}
