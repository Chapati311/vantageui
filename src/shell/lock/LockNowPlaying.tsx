import { AnimatePresence, motion } from 'motion/react';
import { PauseIcon, PlayIcon, SkipNextIcon, SkipPreviousIcon } from '../../components/glyphs';
import { Pressable } from '../../components/Pressable';
import { runAction } from '../../system/actions';
import { currentTrack, usePlayer } from '../../system/musicPlayer';
import { SPRING } from '../../theme/tokens';
import styles from './Lock.module.css';

/**
 * The song you're playing (your own music), with controls, right on the
 * lock screen. A thin line underneath shows how far into the song you are.
 * (Music from other apps needs the native bridge.)
 */
export function LockNowPlaying() {
  const player = usePlayer();
  const song = currentTrack(player);
  const show = song !== undefined && (player.playing || player.position > 0);

  return (
    <AnimatePresence>
      {show && song && (
        <motion.div
          className={styles.playing}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={SPRING.ui}
          onPointerDownCapture={(event) => event.stopPropagation()}
        >
          <span className={styles.playingText}>
            <span className={styles.playingTitle}>{song.title}</span>
            <span className={styles.playingArtist}>{song.artist || 'Your music'}</span>
          </span>
          <Pressable className={styles.playingButton} aria-label="Previous song" onClick={() => void runAction('music.previous', {})}>
            <SkipPreviousIcon />
          </Pressable>
          <Pressable
            className={styles.playingButton}
            aria-label={player.playing ? 'Pause' : 'Play'}
            onClick={() => void runAction('music.togglePlay', {})}
          >
            {player.playing ? <PauseIcon /> : <PlayIcon />}
          </Pressable>
          <Pressable className={styles.playingButton} aria-label="Next song" onClick={() => void runAction('music.next', {})}>
            <SkipNextIcon />
          </Pressable>
          <span
            className={styles.playingBar}
            style={{ transform: `scaleX(${song.duration ? Math.min(1, player.position / song.duration) : 0})` }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
