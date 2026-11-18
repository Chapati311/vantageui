import { useRef, useState } from 'react';
import { CircleButton } from '../../components/CircleButton';
import { PauseIcon, PlayIcon, PlusIcon, SkipNextIcon, SkipPreviousIcon } from '../../components/glyphs';
import { AppShell, EmptyState, Row, Section, SegmentedControl, SwipeToDelete } from '../../components/kit';
import { MusicIcon } from '../../system/appIcons';
import {
  addTracks,
  currentTrack,
  next,
  play,
  previous,
  removeTrack,
  seek,
  setRepeat,
  setShuffle,
  togglePlay,
  usePlayer,
} from '../../system/musicPlayer';
import styles from './Music.module.css';

const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
const RING = 2 * Math.PI * 46;

/**
 * Music for your own song files. The signature: the song plays around a
 * thin circular progress ring; drag around the ring to jump.
 */
export function MusicApp() {
  const player = usePlayer();
  const track = currentTrack(player);
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const progress = track && track.duration ? player.position / track.duration : 0;

  const seekFrom = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!track?.duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const angle = Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2));
    const fraction = ((angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
    seek(fraction * track.duration);
  };

  return (
    <AppShell
      title="Music"
      trailing={
        <CircleButton small label="Add songs" onClick={() => input.current?.click()}>
          <PlusIcon />
        </CircleButton>
      }
    >
      <input
        ref={input}
        type="file"
        accept="audio/*"
        multiple
        hidden
        onChange={(event) => {
          const files = event.target.files;
          if (files?.length) void addTracks(files).then((count) => setMessage(count ? `${count} song${count === 1 ? '' : 's'} added` : 'Those files are not songs.'));
          event.target.value = '';
        }}
      />

      {player.loaded && player.tracks.length === 0 ? (
        <EmptyState
          icon={MusicIcon}
          title="No music yet"
          message="Add song files from Files or iCloud. They are kept on this phone. Apple Music and Spotify widgets are in Customise."
          action={{ label: 'Add songs', onPress: () => input.current?.click() }}
        />
      ) : (
        <>
          <div className={styles.player}>
            <svg
              className={styles.ring}
              viewBox="0 0 100 100"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                seekFrom(event);
              }}
              onPointerMove={(event) => event.buttons && seekFrom(event)}
              role="slider"
              aria-label="Position in the song"
              aria-valuenow={Math.round(progress * 100)}
            >
              <circle className={styles.track} cx="50" cy="50" r="46" />
              <circle className={styles.progress} cx="50" cy="50" r="46" strokeDasharray={`${RING * progress} ${RING}`} transform="rotate(-90 50 50)" />
              <circle className={styles.knob} cx={50 + 46 * Math.sin(progress * Math.PI * 2)} cy={50 - 46 * Math.cos(progress * Math.PI * 2)} r="2.6" />
            </svg>
            <div className={styles.center}>
              <span className={styles.title}>{track ? track.title : 'Pick a song'}</span>
              <span className={styles.artist}>{track ? track.artist : `${player.tracks.length} songs`}</span>
              <span className="label">{track ? `${time(player.position)} / ${time(track.duration)}` : ' '}</span>
            </div>
          </div>
          <div className={styles.controls}>
            <CircleButton small label="Previous" onClick={previous}>
              <SkipPreviousIcon />
            </CircleButton>
            <CircleButton label={player.playing ? 'Pause' : 'Play'} onClick={togglePlay}>
              {player.playing ? <PauseIcon /> : <PlayIcon />}
            </CircleButton>
            <CircleButton small label="Next" onClick={next}>
              <SkipNextIcon />
            </CircleButton>
          </div>
          <SegmentedControl
            label="Play order"
            value={player.shuffle ? 'shuffle' : player.repeat ? 'repeat' : 'order'}
            onChange={(value) => {
              setShuffle(value === 'shuffle');
              setRepeat(value === 'repeat');
            }}
            options={[
              { id: 'order', label: 'In order' },
              { id: 'shuffle', label: 'Shuffle' },
              { id: 'repeat', label: 'Repeat one' },
            ]}
          />
          <Section label="Library" note={message ?? 'Swipe a song left to remove it.'}>
            {player.tracks.map((item) => (
              <SwipeToDelete key={item.id} onDelete={() => void removeTrack(item.id)}>
                <Row title={item.title} detail={item.artist} value={item.id === player.currentId && player.playing ? 'Playing' : time(item.duration)} onPress={() => void play(item.id)} />
              </SwipeToDelete>
            ))}
          </Section>
        </>
      )}
    </AppShell>
  );
}
