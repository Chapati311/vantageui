import styles from './VoiceNoteWidget.module.css';

/** How many dots tall each column of the waveform is. */
const WAVE = [1, 3, 5, 2, 4, 3, 1];
const DOT_GAP = 3; // distance between dot centres, in drawing units
const WIDTH = (WAVE.length - 1) * DOT_GAP + 2;
const HEIGHT = 4 * DOT_GAP + 2;

/**
 * "Voice note": the one accent-filled circle on its page, with a waveform
 * drawn in dots. A placeholder button for now - recording comes later.
 */
export function VoiceNoteWidget() {
  return (
    <div className={styles.button} role="button" aria-label="Voice note">
      <svg className={styles.wave} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
        {WAVE.flatMap((dots, column) =>
          Array.from({ length: dots }, (_, row) => (
            <circle
              key={`${column}-${row}`}
              cx={1 + column * DOT_GAP}
              // Each column is centred vertically
              cy={HEIGHT / 2 + (row - (dots - 1) / 2) * DOT_GAP}
              r="1"
            />
          )),
        )}
      </svg>
    </div>
  );
}
