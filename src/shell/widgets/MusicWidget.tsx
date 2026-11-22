import { useEffect, useRef } from 'react';
import { Widget } from '../../components/Widget';
import { PauseIcon, PlayIcon, SkipNextIcon, SkipPreviousIcon } from '../../components/glyphs';
import { setCustomiseSection } from '../../apps/customise/customiseNav';
import { runAction } from '../../system/actions';
import { currentTrack, getAnalyser, next, previous, togglePlay, usePlayer } from '../../system/musicPlayer';
import { connectSpotify, spotifyControl, useSpotify } from '../../system/spotify';
import { hasRealControls, mediaCommand, useControls } from '../../system/phoneControls';
import { getNativeApp } from '../../system/nativeApps';
import { openApp as openNativeApp } from '../../system/nativeBridge';
import styles from './MusicWidget.module.css';

const COLUMNS = 9;
const ROWS = 4;

/**
 * A small dot visualizer. With your own music it follows the real sound;
 * with Spotify (whose sound a web app can't hear) the dots dance gently.
 */
function Dots({ playing, live }: { playing: boolean; live: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || !playing) return;
    const dots = Array.from(element.children) as HTMLElement[];
    const data = new Uint8Array(32);
    let frame = 0;
    let time = 0;
    const draw = () => {
      time += 1;
      const analyser = live ? getAnalyser() : null;
      if (analyser) analyser.getByteFrequencyData(data);
      for (let column = 0; column < COLUMNS; column += 1) {
        const level = analyser
          ? data[Math.floor((column / COLUMNS) * 20)] / 255
          : 0.35 + 0.35 * Math.sin(time / 9 + column * 0.9) * Math.sin(time / 23 + column * 0.4);
        const lit = Math.round(level * ROWS);
        for (let row = 0; row < ROWS; row += 1) {
          const dot = dots[row * COLUMNS + column];
          if (dot) dot.style.opacity = ROWS - row <= lit ? '1' : 'var(--ghost, 0.08)';
        }
      }
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(frame);
      dots.forEach((dot) => (dot.style.opacity = ''));
    };
  }, [playing, live]);
  return (
    <div ref={ref} className={styles.dots} aria-hidden="true">
      {Array.from({ length: COLUMNS * ROWS }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function Controls({ playing, onToggle, onNext, onPrevious }: { playing: boolean; onToggle: () => void; onNext: () => void; onPrevious: () => void }) {
  return (
    <div className={styles.controls}>
      <button type="button" className={styles.skip} aria-label="Previous" onClick={onPrevious}>
        <SkipPreviousIcon />
      </button>
      <button type="button" className={styles.play} aria-label={playing ? 'Pause' : 'Play'} onClick={onToggle}>
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button type="button" className={styles.skip} aria-label="Next" onClick={onNext}>
        <SkipNextIcon />
      </button>
    </div>
  );
}

/**
 * Now playing. On the phone (host mode): whatever ANY app is playing (Music,
 * Spotify, YouTube...), with real controls. Otherwise Spotify (when
 * connected), your own music (the last song you played), or a Connect button.
 */
export function MusicWidget() {
  const spotify = useSpotify();
  const player = usePlayer();
  const own = currentTrack(player) ?? (player.tracks.length ? player.tracks[0] : undefined);
  const controls = useControls();
  const real = hasRealControls();
  const playing = controls.nowPlaying;

  if (real && playing && !player.playing) {
    return (
      <Widget shape="rounded">
        <div className={styles.music}>
          <div className={styles.head}>
            {playing.artwork ? (
              <img className={styles.cover} src={`data:image/jpeg;base64,${playing.artwork}`} alt="" />
            ) : (
              <span className="label">{playing.playing ? 'Now playing' : 'Paused'}</span>
            )}
            <Dots playing={playing.playing} live={false} />
          </div>
          <div className={styles.text}>
            <span className={styles.title}>{playing.title}</span>
            {playing.artist && <span className={styles.note}>{playing.artist}</span>}
          </div>
          <Controls
            playing={playing.playing}
            onToggle={() => void mediaCommand('toggle')}
            onNext={() => void mediaCommand('next')}
            onPrevious={() => void mediaCommand('previous')}
          />
        </div>
      </Widget>
    );
  }

  if (spotify.connected && spotify.track) {
    const track = spotify.track;
    return (
      <Widget shape="rounded">
        <div className={styles.music}>
          <div className={styles.head}>
            {track.cover && <img className={styles.cover} src={track.cover} alt="" />}
            <Dots playing={track.playing} live={false} />
          </div>
          <div className={styles.text}>
            <span className={styles.title}>{track.title}</span>
            <span className={styles.note}>{track.artist}</span>
          </div>
          <Controls
            playing={track.playing}
            onToggle={() => void spotifyControl(track.playing ? 'pause' : 'play')}
            onNext={() => void spotifyControl('next')}
            onPrevious={() => void spotifyControl('previous')}
          />
        </div>
      </Widget>
    );
  }

  if (own) {
    return (
      <Widget shape="rounded">
        <div className={styles.music}>
          <div className={styles.head}>
            <span className="label">{player.playing ? 'Now playing' : 'Last played'}</span>
            <Dots playing={player.playing} live />
          </div>
          <div className={styles.text}>
            <span className={styles.title}>{own.title}</span>
            <span className={styles.note}>{own.artist}</span>
          </div>
          <Controls playing={player.playing} onToggle={togglePlay} onNext={next} onPrevious={previous} />
        </div>
      </Widget>
    );
  }

  return (
    <Widget shape="rounded">
      <div className={styles.music}>
        <div className={styles.head}>
          <span className="label">Music</span>
          <Dots playing live={false} />
        </div>
        <div className={styles.text}>
          <span className={styles.title}>Nothing playing</span>
          <span className={styles.note}>{real ? 'Play something in any app and it shows here.' : 'Connect Spotify, or add your own songs in Music.'}</span>
        </div>
        <button
          type="button"
          className={`hit-44 ${styles.connect}`}
          onClick={() => {
            // On the phone no sign-in is needed: play in Spotify / Music and it shows here
            if (real) {
              void openNativeApp(getNativeApp('com.spotify.client') ? 'com.spotify.client' : 'com.apple.Music');
              return;
            }
            if (spotify.clientId) {
              void connectSpotify().catch(() => undefined);
              return;
            }
            // No Spotify app yet: Customise > Music explains the two steps
            setCustomiseSection('music');
            void runAction('app.open', { appId: 'customise' });
          }}
          aria-label={real ? 'Open a music app' : 'Connect Spotify'}
        >
          {real ? (getNativeApp('com.spotify.client') ? 'Open Spotify' : 'Open Music') : 'Connect'}
        </button>
      </div>
    </Widget>
  );
}
