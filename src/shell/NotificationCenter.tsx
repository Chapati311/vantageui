import { useDrag } from '@use-gesture/react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useRef } from 'react';
import { BellIcon } from '../components/glyphs';
import { Button, EmptyState, Row, Section } from '../components/kit';
import { runAction } from '../system/actions';
import { getApp } from '../system/appRegistry';
import { timeAgo, useNotifications } from '../system/notifications';
import { MOTION, SPRING, rubberBand } from '../theme/tokens';
import styles from './NotificationCenter.module.css';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Pulled down from the top-left edge. Vantage's own notifications, newest
 * first: tap one to open its app, swipe it left to remove it. Drag the panel
 * up (or flick) to close it.
 */
export function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const notifications = useNotifications();
  const panel = useRef<HTMLDivElement>(null);

  // 0 = parked above the screen, 1 = fully down
  const shown = useMotionValue(open ? 1 : 0);
  const y = useTransform(shown, (value) => `${(value - 1) * 100}%`);

  useEffect(() => {
    animate(shown, open ? 1 : 0, SPRING.sheet);
  }, [open, shown]);

  const bind = useDrag(
    ({ first, last, movement: [, moved], velocity: [, speed], direction: [, direction], memo, event, cancel }) => {
      const height = panel.current?.offsetHeight ?? 1;
      if (first) {
        // Dragging inside the list scrolls the list instead
        if ((event.target as HTMLElement).closest('[data-notification-list]')) {
          cancel();
          return;
        }
        shown.stop();
        memo = shown.get();
      }
      const value = rubberBand((memo as number) + moved / height, 0, 1);
      if (!last) {
        shown.set(value);
        return memo;
      }
      const flick = speed > MOTION.flickVelocity;
      const stayOpen = flick ? direction > 0 : value > 0.6;
      animate(shown, stayOpen ? 1 : 0, SPRING.sheet);
      if (!stayOpen) onClose();
      return memo;
    },
    { axis: 'y', filterTaps: true, enabled: open },
  );

  const openFrom = (appId: string, id: string) => {
    void runAction('notifications.dismiss', { id });
    onClose();
    void runAction('app.open', { appId });
  };

  return (
    <div className={`${styles.layer} ${open ? styles.open : ''}`} aria-hidden={!open}>
      <motion.div ref={panel} className={styles.panel} style={{ y }} role="dialog" aria-label="Notifications" {...(bind() as object)}>
        <div className={styles.header}>
          <h1 className={styles.title}>Notifications</h1>
          {notifications.length > 0 && <Button onPress={() => void runAction('notifications.clear', {})}>Clear</Button>}
        </div>

        <div className={styles.list} data-notification-list>
          {notifications.length === 0 ? (
            <EmptyState icon={BellIcon} title="All quiet" message="Timers and reminders from your Vantage apps show up here." />
          ) : (
            <Section>
              {notifications.map((item) => {
                const app = getApp(item.appId);
                const Glyph = app?.icon;
                return (
                  <Row
                    key={item.id}
                    icon={Glyph ? <Glyph /> : undefined}
                    title={item.title}
                    detail={item.body}
                    value={timeAgo(item.at)}
                    onPress={() => openFrom(item.appId, item.id)}
                    onDelete={() => void runAction('notifications.dismiss', { id: item.id })}
                  />
                );
              })}
            </Section>
          )}
          <p className={styles.note}>Notifications from other apps: available after unlock.</p>
        </div>

        <span className={styles.handle} />
      </motion.div>
    </div>
  );
}
