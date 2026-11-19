import { useEffect, useRef, useState } from 'react';
import { Button, Slider } from '../../components/kit';
import { runAction } from '../../system/actions';
import type { Recording } from '../../system/recordings';
import styles from './Recorder.module.css';

const seconds = (value: number) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`;

/** Rename a recording, or keep only part of it (saved as a trimmed copy). */
export function EditRecording({ recording, onDone }: { recording: Recording; onDone: () => void }) {
  const length = Math.max(1, recording.duration / 1000);
  const [name, setName] = useState(recording.name);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(Math.round(length * 10) / 10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => audio.current?.pause(), []);

  // Hear just the part you are keeping
  const preview = () => {
    audio.current?.pause();
    const element = new Audio(URL.createObjectURL(recording.blob));
    element.currentTime = start;
    element.ontimeupdate = () => element.currentTime >= end && element.pause();
    audio.current = element;
    void element.play();
  };

  return (
    <div className={styles.edit}>
      <div className={styles.renameRow}>
        <input
          className={styles.input}
          aria-label="Recording name"
          value={name}
          maxLength={48}
          onChange={(event) => setName(event.target.value)}
        />
        <Button
          disabled={!name.trim() || name === recording.name}
          onPress={() => {
            void runAction('recorder.rename', { id: recording.id, name });
            onDone();
          }}
        >
          Rename
        </Button>
      </div>

      <span className="label">
        Keep {seconds(end - start)} of {seconds(length)}
      </span>
      <Slider
        label="From"
        value={start}
        min={0}
        max={length}
        step={0.1}
        format={seconds}
        onChange={(value) => setStart(Math.min(value, end - 0.5))}
      />
      <Slider
        label="To"
        value={end}
        min={0}
        max={length}
        step={0.1}
        format={seconds}
        onChange={(value) => setEnd(Math.max(value, start + 0.5))}
      />
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.editButtons}>
        <Button onPress={preview}>Listen</Button>
        <Button
          kind="primary"
          disabled={busy || (start === 0 && end >= length - 0.05)}
          onPress={async () => {
            setBusy(true);
            setError(null);
            try {
              await runAction('recorder.trim', { id: recording.id, start, end });
              onDone();
            } catch (problem) {
              setError((problem as Error).message || "This recording couldn't be trimmed.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? 'Saving' : 'Save trimmed copy'}
        </Button>
      </div>
    </div>
  );
}
