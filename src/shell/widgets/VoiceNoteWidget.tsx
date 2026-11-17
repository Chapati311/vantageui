import { useEffect, useState } from 'react';
import { playSound } from '../../system/sounds';
import { startRecording, stopRecording, useRecorder } from '../../system/recordings';
import styles from './VoiceNoteWidget.module.css';

/** How many dots tall each column of the waveform is. */
const WAVE = [1, 3, 5, 2, 4, 3, 1];
const DOT_GAP = 3; // distance between dot centres, in drawing units
const WIDTH = (WAVE.length - 1) * DOT_GAP + 2;
const HEIGHT = 4 * DOT_GAP + 2;

const seconds = (ms: number) => {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/**
 * "Voice note": the one accent-filled circle on its page. Tap to start
 * recording, tap again to stop and save (the Voice Recorder app lists them).
 */
export function VoiceNoteWidget() {
  const { recordingSince, error } = useRecorder();
  const [now, setNow] = useState(Date.now);
  const recording = recordingSince !== null;

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [recording]);

  return (
    <button
      type="button"
      className={`${styles.button} ${recording ? styles.recording : ''}`}
      aria-label={recording ? 'Stop recording' : error ?? 'Record a voice note'}
      onClick={() => {
        playSound(recording ? 'toggleOff' : 'toggleOn');
        if (recording) stopRecording();
        else void startRecording();
      }}
    >
      {recording ? (
        <span className={styles.time}>{seconds(now - recordingSince)}</span>
      ) : (
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
      )}
    </button>
  );
}
