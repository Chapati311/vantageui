import { DotLogo } from '../../components/DotLogo';
import { MicIcon } from '../../components/glyphs';
import styles from './AskWidget.module.css';

/**
 * The "Ask Vantage" bar: a frosted pill across the whole grid.
 * It is a placeholder for the assistant; for now tapping it opens search
 * (that is set in widgetRegistry).
 */
export function AskWidget() {
  return (
    <div className={styles.bar} role="button" aria-label="Ask Vantage">
      <span className={styles.logo}>
        <DotLogo />
      </span>
      <span className={styles.placeholder}>Ask anything</span>
      <span className={styles.mic}>
        <MicIcon />
      </span>
    </div>
  );
}
