import { useState } from 'react';
import { DotNumber } from '../../components/DotNumber';
import { Pressable } from '../../components/Pressable';
import { APPS } from '../../system/appRegistry';
import { formatTime } from '../../system/timeFormat';
import { useClock } from '../../system/useClock';
import styles from './Retro.module.css';

const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

/** A grey window with a navy title bar. */
export function RetroWindow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.window}>
      <div className={styles.titleBar}>
        <span>{title}</span>
        <span className={styles.titleButton} aria-hidden="true">x</span>
      </div>
      <div className={styles.windowBody}>{children}</div>
    </div>
  );
}

/**
 * Classic Desktop: a teal desktop with a few app icons, a clock window, and a
 * taskbar with a Start button (which opens a menu of every app) and the time.
 */
export function RetroDesktop({ onOpenApp }: { onOpenApp: (appId: string) => void }) {
  const now = useClock();
  const [startOpen, setStartOpen] = useState(false);

  return (
    <div className={styles.desktop}>
      <div className={styles.desktopIcons}>
        {APPS.slice(0, 4).map((app) => {
          const Glyph = app.icon;
          return (
            <Pressable key={app.id} className={styles.desktopIcon} onClick={() => onOpenApp(app.id)}>
              <span className={styles.desktopGlyph}>
                <Glyph />
              </span>
              <span className={styles.desktopLabel}>{app.name}</span>
            </Pressable>
          );
        })}
      </div>

      <div className={styles.desktopClock}>
        <RetroWindow title="Clock">
          <DotNumber value={formatTime(now)} size={40} />
          <p className={styles.windowText}>{dayFormat.format(now)}</p>
        </RetroWindow>
      </div>

      {startOpen && (
        <div className={styles.startMenu}>
          {APPS.map((app) => {
            const Glyph = app.icon;
            return (
              <Pressable
                key={app.id}
                className={styles.startItem}
                onClick={() => {
                  setStartOpen(false);
                  onOpenApp(app.id);
                }}
              >
                <span className={styles.startGlyph}>
                  <Glyph />
                </span>
                {app.name}
              </Pressable>
            );
          })}
        </div>
      )}

      <div className={styles.taskbar}>
        <Pressable
          className={`${styles.startButton} ${startOpen ? styles.pressedIn : ''}`}
          aria-expanded={startOpen}
          onClick={() => setStartOpen(!startOpen)}
        >
          Start
        </Pressable>
        <span className={styles.trayClock}>{formatTime(now)}</span>
      </div>
    </div>
  );
}
