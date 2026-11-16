import { useEffect, useState } from 'react';
import { Widget } from '../../components/Widget';
import { PauseIcon, PlayIcon, SkipNextIcon, SkipPreviousIcon } from '../../components/glyphs';
import styles from './MusicWidget.module.css';

/**
 * DEMO data. A web app can't see or control the phone's music, so this
 * widget plays through a made-up list until the native bridge exists.
 */
const DEMO_TRACKS = [
  { title: 'Night Signal', artist: 'Demo track 1', seconds: 184 },
  { title: 'Soft Static', artist: 'Demo track 2', seconds: 212 },
  { title: 'Glass Hours', artist: 'Demo track 3', seconds: 157 },
];

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** "Now playing": a thin progress ring around play/pause, with skip buttons. */
export function MusicWidget() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0); // seconds into the track
  const track = DEMO_TRACKS[index];

  const skip = (step: number) => {
    setIndex((current) => (current + step + DEMO_TRACKS.length) % DEMO_TRACKS.length);
    setPosition(0);
  };

  // While "playing", move forward one second at a time.
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setPosition((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [playing]);

  // At the end of a track, go to the next one.
  useEffect(() => {
    if (position >= track.seconds) skip(1);
  }, [position, track.seconds]);

  const progress = Math.min(1, position / track.seconds);

  return (
    <Widget shape="rounded">
      <div className={styles.music}>
        <span className={styles.label}>Now playing</span>

        <div className={styles.controls}>
          <button type="button" className={styles.skip} aria-label="Previous track" data-no-gesture onClick={() => skip(-1)}>
            <SkipPreviousIcon />
          </button>

          <button
            type="button"
            className={styles.play}
            aria-label={playing ? 'Pause' : 'Play'}
            data-no-gesture
            onClick={() => setPlaying(!playing)}
          >
            <svg className={styles.ring} viewBox="0 0 100 100" aria-hidden="true">
              <circle className={styles.track} cx="50" cy="50" r={RADIUS} />
              <circle
                className={styles.progress}
                cx="50"
                cy="50"
                r={RADIUS}
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              />
            </svg>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>

          <button type="button" className={styles.skip} aria-label="Next track" data-no-gesture onClick={() => skip(1)}>
            <SkipNextIcon />
          </button>
        </div>

        <div className={styles.text}>
          <span className={styles.title}>{track.title}</span>
          <span className={styles.label}>{track.artist}</span>
        </div>
      </div>
    </Widget>
  );
}
