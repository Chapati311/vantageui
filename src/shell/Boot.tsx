import { useEffect, useState } from 'react';
import { DotLogo } from '../components/DotLogo';
import styles from './Boot.module.css';

const OS_NAME = 'VANTAGE OS';
/** How long the boot screen stays before it fades out. */
const BOOT_MS = 2000;
/** The name starts appearing after the logo, one letter at a time. */
const NAME_START_MS = 700;
const LETTER_STAGGER_MS = 55;

interface BootProps {
  onDone: () => void;
}

/** Shown once when the OS starts: logo and name light up, then it fades away. */
export function Boot({ onDone }: BootProps) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fade = window.setTimeout(() => setFading(true), BOOT_MS);
    const done = window.setTimeout(onDone, BOOT_MS + 460);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(done);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`${styles.boot} ${fading ? styles.fading : ''}`}>
      <div className={styles.logo}>
        <DotLogo animated dissolve={fading} />
      </div>
      <div className={styles.name} aria-label={OS_NAME}>
        {[...OS_NAME].map((letter, index) => (
          <span
            key={index}
            className={styles.letter}
            style={{ animationDelay: `${NAME_START_MS + index * LETTER_STAGGER_MS}ms` }}
            aria-hidden="true"
          >
            {letter === ' ' ? ' ' : letter}
          </span>
        ))}
      </div>
    </div>
  );
}
