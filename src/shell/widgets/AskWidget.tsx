import { DotLogo } from '../../components/DotLogo';
import { MicIcon } from '../../components/glyphs';
import styles from './AskWidget.module.css';

/**
 * The "Ask Vantage" bar: a frosted pill across the whole grid.
 * Tapping it summons Vantage (the overlay with the dotted V orb).
 */
export function AskWidget() {
  return (
    <div className={styles.bar} aria-label="Ask Vantage">
      <span className={styles.logo}>
        {/* Monochrome here: the page already has its one accent element */}
        <DotLogo mono />
      </span>
      <span className={styles.placeholder}>Ask anything</span>
      <span className={styles.mic}>
        <MicIcon />
      </span>
    </div>
  );
}
