import { useEffect, useRef, useState } from 'react';
import { DotNumber } from '../../components/DotNumber';
import { MicIcon, PauseIcon, PlayIcon } from '../../components/glyphs';
import { AppShell, ContextMenu, EmptyState, Row, Section, Sheet, SwipeToDelete } from '../../components/kit';
import { EditIcon, TrashIcon } from '../../components/glyphs';
import { EditRecording } from './EditRecording';
import { LiveWave } from './LiveWave';
import { Pressable } from '../../components/Pressable';
import { deleteRecording, startRecording, stopRecording, useRecorder, type Recording } from '../../system/recordings';
import styles from './Recorder.module.css';

const clock = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};

/**
 * Voice Recorder: one big round button, a live dot-matrix timer and a dot
 * waveform while it listens, your recordings below (hold one to rename or
 * trim it).
 */
export function RecorderApp() {
  const { recordings, recordingSince, error, loaded } = useRecorder();
  const [now, setNow] = useState(Date.now);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Recording | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const recording = recordingSince !== null;

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [recording]);

  useEffect(() => () => audio.current?.pause(), []);

  const toggle = (item: Recording) => {
    if (playingId === item.id) {
      audio.current?.pause();
      setPlayingId(null);
      return;
    }
    audio.current?.pause();
    const element = new Audio(URL.createObjectURL(item.blob));
    element.onended = () => setPlayingId(null);
    audio.current = element;
    void element.play();
    setPlayingId(item.id);
  };

  return (
    <AppShell title="Recorder">
      <div className={styles.top}>
        <DotNumber value={clock(recording ? now - recordingSince : 0)} size={64} muted={!recording} />
        <LiveWave active={recording} />
        <Pressable
          className={`${styles.record} ${recording ? styles.recording : ''}`}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
          onClick={() => (recording ? stopRecording() : void startRecording())}
        >
          {recording ? <span className={styles.stopSquare} /> : <MicIcon />}
        </Pressable>
        <span className="label">{error ?? (recording ? 'Recording' : 'Tap to record')}</span>
      </div>
      {loaded && recordings.length === 0 ? (
        <EmptyState title="No recordings" message="They are kept on this phone. The Voice note widget records here too." />
      ) : (
        <Section label="Recordings" note="Hold one to rename or trim it. Swipe left to delete.">
          {recordings.map((item) => (
            <ContextMenu
              key={item.id}
              items={[
                { label: 'Rename or trim', icon: EditIcon, onSelect: () => setEditing(item) },
                { label: 'Delete', icon: TrashIcon, destructive: true, onSelect: () => void deleteRecording(item.id) },
              ]}
            >
              <SwipeToDelete onDelete={() => void deleteRecording(item.id)}>
                <Row
                  icon={playingId === item.id ? <PauseIcon /> : <PlayIcon />}
                  title={item.name}
                  value={clock(item.duration)}
                  onPress={() => toggle(item)}
                />
              </SwipeToDelete>
            </ContextMenu>
          ))}
        </Section>
      )}
      <Sheet open={editing !== null} onClose={() => setEditing(null)} title="Edit recording">
        {editing && <EditRecording key={editing.id} recording={editing} onDone={() => setEditing(null)} />}
      </Sheet>
    </AppShell>
  );
}
