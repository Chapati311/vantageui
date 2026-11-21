import { useDrag } from '@use-gesture/react';
import { isHosted } from '../system/nativeBridge';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable } from '../components/Pressable';
import type { VantageNotification } from '../system/notifications';
import { BellIcon } from '../components/glyphs';
import { Button, EmptyState, Row, Section } from '../components/kit';
import { runAction } from '../system/actions';
import { getApp } from '../system/appRegistry';
import { isRealNotification, openRealNotification, timeAgo, useNotifications } from '../system/notifications';
import { MOTION, SPRING, rubberBand } from '../theme/tokens';
import styles from './NotificationCenter.module.css';

/** One quick action per app, shown on its group (e.g. Clock: another 5 minutes). */
const GROUP_ACTIONS: Record<string, { label: string; run: () => void }> = {
  clock: { label: '+5 min', run: () => void runAction('timer.quick', { minutes: 5 }) },
  lockin: { label: 'Focus again', run: () => void runAction('focus.start', {}) },
  weather: { label: 'Refresh', run: () => void runAction('weather.refresh', {}) },
};

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Pulled down from the top-left edge. Vantage's own notifications, grouped
 * by app (newest first), each group with a Clear and sometimes a quick
 * action: tap one to open its app, swipe it left to remove it. Drag the panel
 * up (or flick) to close it.
 */
export function NotificationCenter({ open, onClose }: NotificationCenterProps) {
  const notifications = useNotifications();
  const panel = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<string[]>([]);
  // Grouped by app, the group with the newest notification first
  const groups = useMemo(() => {
    const byApp = new Map<string, VantageNotification[]>();
    for (const item of notifications) byApp.set(item.appId, [...(byApp.get(item.appId) ?? []), item]);
    return [...byApp.entries()];
  }, [notifications]);

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
    onClose();
    // A real notification opens what it is about (the chat, the email...) through iOS
    if (isRealNotification(id)) return openRealNotification(id);
    void runAction('notifications.dismiss', { id });
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
            <EmptyState icon={BellIcon} title="All quiet" message={isHosted() ? 'New notifications from your apps show up here.' : 'Timers and reminders from your Vantage apps show up here.'} />
          ) : (
            groups.map(([appId, items]) => {
              const app = getApp(appId);
              const Glyph = app?.icon;
              const action = GROUP_ACTIONS[appId];
              const folded = items.length > 2 && !expanded.includes(appId);
              return (
                <section key={appId} className={styles.group}>
                  <div className={styles.groupHead}>
                    <span className="label">
                      {app?.name ?? 'Vantage'}
                      {items.length > 1 ? ` · ${items.length}` : ''}
                    </span>
                    {action && (
                      <Pressable className={`label hit-44 ${styles.groupButton}`} onClick={action.run}>
                        {action.label}
                      </Pressable>
                    )}
                    <Pressable
                      className={`label hit-44 ${styles.groupButton}`}
                      onClick={() => items.forEach((item) => void runAction('notifications.dismiss', { id: item.id }))}
                    >
                      Clear
                    </Pressable>
                  </div>
                  <Section>
                    {(folded ? items.slice(0, 2) : items).map((item) => (
                      <Row
                        key={item.id}
                        icon={Glyph ? <Glyph /> : undefined}
                        title={item.title}
                        detail={item.body}
                        value={timeAgo(item.at)}
                        onPress={() => openFrom(item.appId, item.id)}
                        onDelete={() => void runAction('notifications.dismiss', { id: item.id })}
                      />
                    ))}
                  </Section>
                  {folded && (
                    <Pressable className={`label hit-44 ${styles.more}`} onClick={() => setExpanded((list) => [...list, appId])}>
                      Show {items.length - 2} more
                    </Pressable>
                  )}
                </section>
              );
            })
          )}
          {/* On the phone (host mode) nothing is "after unlock": real notifications come in Part 3 */}
          {!isHosted() && <p className={styles.note}>Notifications from other apps: available after unlock.</p>}
        </div>

        <span className={styles.handle} />
      </motion.div>
    </div>
  );
}
