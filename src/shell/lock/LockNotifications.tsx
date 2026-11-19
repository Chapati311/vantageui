import { AnimatePresence, motion, type PanInfo } from 'motion/react';
import { useState } from 'react';
import { Pressable } from '../../components/Pressable';
import { getApp } from '../../system/appRegistry';
import { runAction } from '../../system/actions';
import { useNotifications } from '../../system/notifications';
import { SPRING } from '../../theme/tokens';
import styles from './Lock.module.css';

const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

/**
 * Vantage's notifications as a stack on the lock screen: the newest on top,
 * the next two peeking out below. Tap the stack to spread it out; swipe a
 * card sideways to clear it.
 */
export function LockNotifications() {
  const notifications = useNotifications();
  const [open, setOpen] = useState(false);
  const shown = notifications.slice(0, open ? 3 : 3);
  if (notifications.length === 0) return null;

  const dismiss = (id: string) => void runAction('notifications.dismiss', { id });

  return (
    <div
      className={`${styles.stack} ${open ? styles.stackOpen : ''}`}
      // Swipes on the cards belong to the cards, not to the unlock gesture
      onPointerDownCapture={(event) => event.stopPropagation()}
    >
      <AnimatePresence initial={false}>
        {shown.map((note, index) => {
          const app = getApp(note.appId);
          const behind = !open && index > 0;
          return (
            <motion.div
              key={note.id}
              // Cards stacked behind only peek out as edges: their text would show through the glass
              className={`${styles.note} ${behind ? styles.behind : ''}`}
              layout
              drag={index === 0 || open ? 'x' : false}
              dragSnapToOrigin
              dragElastic={0.6}
              onDragEnd={(_, info: PanInfo) => {
                if (Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 500) dismiss(note.id);
              }}
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{
                opacity: behind ? 1 - index * 0.35 : 1,
                y: behind ? index * 10 : 0,
                scale: behind ? 1 - index * 0.05 : 1,
              }}
              exit={{ opacity: 0, x: 120, transition: { duration: 0.2 } }}
              transition={SPRING.ui}
              style={{ zIndex: 10 - index, position: behind ? 'absolute' : 'relative', top: behind ? 0 : undefined, left: 0, right: 0 }}
              onClick={() => notifications.length > 1 && setOpen((value) => !value)}
            >
              <span className={styles.noteHead}>
                <span className="label">{app?.name ?? 'Vantage'}</span>
                <span className="label">{timeFormat.format(note.at)}</span>
              </span>
              <span className={styles.noteTitle}>{note.title}</span>
              {note.body && <span className={styles.noteBody}>{note.body}</span>}
            </motion.div>
          );
        })}
      </AnimatePresence>
      {open ? (
        <Pressable className={`label ${styles.clear}`} onClick={() => void runAction('notifications.clear', {})}>
          Clear all
        </Pressable>
      ) : (
        notifications.length > 3 && <span className={`label ${styles.more}`}>+{notifications.length - 3} more</span>
      )}
    </div>
  );
}
