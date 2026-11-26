import { useEffect, useRef } from 'react';
import { Widget } from '../../../components/Widget';
import { PauseIcon, PlayIcon, SkipNextIcon, SkipPreviousIcon } from '../../../components/glyphs';
import { appleMusicControl, useAppleMusic } from '../../../system/appleMusic';
import { currentTrack, getAnalyser, togglePlay, usePlayer } from '../../../system/musicPlayer';
import { spotifyControl, useSpotify } from '../../../system/spotify';
import type { WidgetProps } from '../types';
import { watchOnScreen } from '../../../system/onScreen';
import styles from './MusicWidgets.module.css';

function Controls({ playing, onToggle, onNext, onPrevious }: { playing: boolean; onToggle: () => void; onNext: () => void; onPrevious: () => void }) {
  return (
    <div className={styles.controls}>
      <button type="button" className={styles.control} onClick={onPrevious} aria-label="Previous">
        <SkipPreviousIcon />
      </button>
      <button type="button" className={`${styles.control} ${styles.play}`} onClick={onToggle} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button type="button" className={styles.control} onClick={onNext} aria-label="Next">
        <SkipNextIcon />
      </button>
    </div>
  );
}

/** What Spotify is playing on any of your devices, with the cover and a progress line. */
export function SpotifyWidget({ size }: WidgetProps) {
  const spotify = useSpotify();
  const track = spotify.track;
  return (
    <Widget shape="rounded">
      <div className={`${styles.player} ${size === '4x2' ? styles.playerWide : ''}`}>
        {!spotify.connected ? (
          <div className={styles.empty}>
            <span className="label">Spotify</span>
            <span className={styles.note}>Connect in Customise &gt; Music</span>
          </div>
        ) : !track ? (
          <div className={styles.empty}>
            <span className="label">Spotify</span>
            <span className={styles.note}>{spotify.status === 'error' ? 'No connection' : 'Nothing playing'}</span>
          </div>
        ) : (
          <>
            {track.cover && <img className={styles.cover} src={track.cover} alt="" />}
            <div className={styles.meta}>
              <span className={styles.title}>{track.title}</span>
              <span className={styles.artist}>{track.artist}</span>
              <span className={styles.progress}>
                <span className={styles.progressFill} style={{ transform: `scaleX(${track.duration ? track.progress / track.duration : 0})` }} />
              </span>
              <Controls
                playing={track.playing}
                onToggle={() => void spotifyControl(track.playing ? 'pause' : 'play')}
                onNext={() => void spotifyControl('next')}
                onPrevious={() => void spotifyControl('previous')}
              />
            </div>
          </>
        )}
      </div>
    </Widget>
  );
}

/** Apple Music through MusicKit (plays inside Vantage). */
export function AppleMusicWidget() {
  const music = useAppleMusic();
  return (
    <Widget shape="rounded">
      <div className={styles.player}>
        {!music.hasToken || !music.signedIn ? (
          <div className={styles.empty}>
            <span className="label">Apple Music</span>
            <span className={styles.note}>{music.hasToken ? 'Sign in in Customise > Music' : 'Needs a MusicKit token (Customise > Music)'}</span>
          </div>
        ) : (
          <div className={styles.meta}>
            <span className={styles.title}>{music.title ?? 'Nothing playing'}</span>
            {music.artist && <span className={styles.artist}>{music.artist}</span>}
            <Controls
              playing={music.playing}
              onToggle={() => void appleMusicControl('toggle')}
              onNext={() => void appleMusicControl('next')}
              onPrevious={() => void appleMusicControl('previous')}
            />
          </div>
        )}
      </div>
    </Widget>
  );
}

const COLUMNS = { '2x1': 12, '4x1': 24 } as Record<string, number>;
const ROWS = 6;

/**
 * Columns of dots that jump with your music (songs playing in the Vantage
 * Music app). Drawn on a canvas, so the home screen does not re-render.
 */
export function VisualizerWidget({ size }: WidgetProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const player = usePlayer();
  const columns = COLUMNS[size] ?? 12;

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const context2d = element.getContext('2d');
    if (!context2d) return;
    const styles = getComputedStyle(element);
    const ink = styles.color;
    let frame = 0;
    let lastDraw = 0;
    let visible = true;
    const data = new Uint8Array(32);

    const draw = (now = 0) => {
      if (player.playing && visible) frame = requestAnimationFrame(draw);
      // 30 updates a second is smooth enough and halves the work
      if (now && now - lastDraw < 32) return;
      lastDraw = now;
      const { width, height } = element;
      context2d.clearRect(0, 0, width, height);
      const analyser = getAnalyser();
      if (analyser && player.playing) analyser.getByteFrequencyData(data);
      else data.fill(0);
      const pitchX = width / columns;
      const pitchY = height / ROWS;
      const radius = Math.min(pitchX, pitchY) * 0.28;
      for (let column = 0; column < columns; column += 1) {
        const value = data[Math.floor((column / columns) * 24)] / 255;
        const lit = Math.round(value * ROWS);
        for (let row = 0; row < ROWS; row += 1) {
          context2d.globalAlpha = ROWS - row <= lit ? 1 : 0.08;
          context2d.fillStyle = ink;
          context2d.beginPath();
          context2d.arc(pitchX * (column + 0.5), pitchY * (row + 0.5), radius, 0, Math.PI * 2);
          context2d.fill();
        }
      }
    };
    draw();
    // Only while it can be seen (not on another page, not behind an app)
    const stopWatching = watchOnScreen(element, (shown) => {
      visible = shown;
      cancelAnimationFrame(frame);
      if (shown && player.playing) frame = requestAnimationFrame(draw);
    });
    return () => {
      stopWatching();
      cancelAnimationFrame(frame);
    };
  }, [columns, player.playing]);

  return (
    <Widget shape="rounded">
      <canvas ref={canvas} className={styles.visualizer} width={columns * 24} height={ROWS * 20} aria-label={player.playing ? 'Music visualizer' : 'Visualizer: nothing playing'} />
    </Widget>
  );
}

/** A record that spins while your music plays. Tap to play or pause. */
export function VinylWidget() {
  const player = usePlayer();
  const track = currentTrack(player);
  return (
    <Widget shape="circle">
      <button type="button" className={styles.vinylButton} onClick={togglePlay} aria-label={player.playing ? 'Pause' : 'Play'}>
        <span className={`${styles.vinyl} ${player.playing ? styles.spinning : ''}`}>
          <span className={styles.groove} />
          <span className={styles.groove2} />
          <span className={styles.label} />
        </span>
      </button>
      <span className={styles.vinylTitle}>{track ? track.title : player.tracks.length ? 'Tap to play' : 'Add music in Music'}</span>
    </Widget>
  );
}
