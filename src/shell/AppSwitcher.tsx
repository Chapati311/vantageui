import { useDrag } from '@use-gesture/react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect } from 'react';
import { ScaledPreview } from '../components/ScaledPreview';
import { EmptyState } from '../components/kit';
import { getApp } from '../system/appRegistry';
import { useTheme } from '../system/theme';
import { MOTION, SPRING } from '../theme/tokens';
import type { ScreenRect } from './AppView';
import styles from './AppSwitcher.module.css';

interface AppSwitcherProps {
  open: boolean;
  /** Recently used app ids, most recent first */
  recents: string[];
  onOpen: (appId: string, from: ScreenRect) => void;
  /** Swiped a card up: forget that app */
  onRemove: (appId: string) => void;
  onClose: () => void;
}

/**
 * The recently used apps as a row of cards, each a live, shrunk-down copy of
 * the app. Swipe sideways to look through them, tap one to jump back in,
 * swipe one up to remove it. Tap the empty space to go home.
 */
export function AppSwitcher({ open, recents, onOpen, onRemove, onClose }: AppSwitcherProps) {
  const retro = useTheme().retro !== null;
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="switcher"
          className={styles.layer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={SPRING.ui}
          onClick={onClose}
          role="dialog"
          aria-label="Recent apps"
        >
          {recents.length === 0 ? (
            <EmptyState title="No recent apps" message="Apps you open show up here." />
          ) : retro ? (
            // Retro themes: a plain numbered list, like an old phone's "recent" menu
            <div className={styles.retroList} onClick={(event) => event.stopPropagation()}>
              <p className={styles.retroTitle}>Recent</p>
              {recents.map((appId, index) => {
                const app = getApp(appId);
                if (!app) return null;
                return (
                  <div key={appId} className={styles.retroRow}>
                    <button type="button" className={styles.retroOpen} onClick={(event) => onOpen(appId, event.currentTarget.getBoundingClientRect())}>
                      {index + 1} {app.name.toUpperCase()}
                    </button>
                    <button type="button" className={styles.retroClose} aria-label={`Close ${app.name}`} onClick={() => onRemove(appId)}>
                      X
                    </button>
                  </div>
                );
              })}
              <button type="button" className={styles.retroBack} onClick={onClose}>
                Back
              </button>
            </div>
          ) : (
            <motion.div
              className={styles.row}
              initial={{ scale: 1.15 }}
              animate={{ scale: 1 }}
              exit={{ scale: 1.15 }}
              transition={SPRING.app}
            >
              <AnimatePresence initial={false}>
                {recents.map((appId) => (
                  <Card key={appId} appId={appId} onOpen={onOpen} onRemove={onRemove} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Card({ appId, onOpen, onRemove }: { appId: string; onOpen: AppSwitcherProps['onOpen']; onRemove: (appId: string) => void }) {
  const app = getApp(appId);
  const y = useMotionValue(0);
  const opacity = useTransform(y, [-240, 0], [0, 1]);

  const bind = useDrag(
    ({ last, movement: [, moved], velocity: [, speed], direction: [, direction] }) => {
      const up = Math.min(0, moved);
      if (!last) {
        y.set(moved > 0 ? moved * 0.2 : up);
        return;
      }
      const flick = speed > MOTION.flickVelocity && direction < 0;
      if (flick || up < -120) void animate(y, -700, SPRING.ui).then(() => onRemove(appId));
      else animate(y, 0, SPRING.ui);
    },
    { axis: 'y', filterTaps: true, pointer: { touch: true } },
  );

  if (!app) return null;
  const Content = app.component;
  const Glyph = app.icon;

  return (
    <motion.div
      className={styles.card}
      layout
      exit={{ opacity: 0, width: 0, marginRight: 0 }}
      transition={SPRING.ui}
      onClick={(event) => event.stopPropagation()}
    >
      <div className={styles.label}>
        <span className={styles.glyph}>
          <Glyph />
        </span>
        {app.name}
      </div>
      {/* A div, not a button: the live app inside has buttons of its own */}
      <motion.div
        role="button"
        tabIndex={0}
        className={styles.preview}
        style={{ y, opacity }}
        aria-label={`Open ${app.name}`}
        whileTap={{ scale: MOTION.pressScale }}
        onClick={(event) => onOpen(appId, event.currentTarget.getBoundingClientRect())}
        onKeyDown={(event) => event.key === 'Enter' && onOpen(appId, event.currentTarget.getBoundingClientRect())}
        {...(bind() as object)}
      >
        <ScaledPreview>
          <div className={styles.app}>
            <Content />
          </div>
        </ScaledPreview>
      </motion.div>
    </motion.div>
  );
}
