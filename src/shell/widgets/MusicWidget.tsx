import { Widget } from '../../components/Widget';
import { PlayIcon, SkipNextIcon, SkipPreviousIcon } from '../../components/glyphs';
import styles from './MusicWidget.module.css';

/**
 * "Now playing". A web app can't see or control what the phone is playing,
 * so until the native bridge exists (after the jailbreak) this shows a clean
 * "Available after unlock" state instead of made-up songs. Spotify and Apple
 * Music versions come in Phase 4.
 */
export function MusicWidget() {
  return (
    <Widget shape="rounded">
      <div className={styles.music}>
        <span className="label">Now playing</span>

        {/* The controls are drawn, but switched off */}
        <div className={styles.controls} aria-hidden="true">
          <span className={styles.skip}>
            <SkipPreviousIcon />
          </span>
          <span className={styles.play}>
            <svg className={styles.ring} viewBox="0 0 100 100">
              <circle className={styles.track} cx="50" cy="50" r="46" />
            </svg>
            <PlayIcon />
          </span>
          <span className={styles.skip}>
            <SkipNextIcon />
          </span>
        </div>

        <div className={styles.text}>
          <span className={styles.title}>System music</span>
          <span className={styles.note}>Available after unlock</span>
        </div>
      </div>
    </Widget>
  );
}
