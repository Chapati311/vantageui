import { DotNumber } from '../../components/DotNumber';
import { formatTime } from '../../system/timeFormat';
import { useBattery } from '../../system/useBattery';
import { useClock } from '../../system/useClock';
import { useOnline } from '../../system/useOnline';
import type { RetroStyle } from '../../theme/presets';
import { RetroStatus } from './RetroStatus';
import styles from './Retro.module.css';

const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });
const yearFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

/**
 * The "idle screen" of an old phone (what you see without touching it):
 * phone style  = status bar, operator, big pixel clock and the date;
 * terminal     = the same facts typed out as commands, with a blinking cursor.
 * `locked` changes the last line of the terminal.
 */
export function RetroIdle({ style, locked }: { style: RetroStyle; locked: boolean }) {
  const now = useClock();
  const battery = useBattery();
  const online = useOnline();

  if (style === 'terminal') {
    return (
      <div className={styles.terminal}>
        <p className={styles.line}>VANTAGE OS 1.0</p>
        <p className={styles.line}>&gt; time</p>
        <div className={styles.terminalClock}>
          <DotNumber value={formatTime(now)} size={40} />
        </div>
        <p className={styles.line}>&gt; date</p>
        <p className={styles.line}>{yearFormat.format(now).replace(/,/g, '').toUpperCase()}</p>
        <p className={styles.line}>&gt; battery</p>
        <p className={styles.line}>{battery ? `${Math.round(battery.level * 100)}%${battery.charging ? ' CHARGING' : ''}` : 'NOT AVAILABLE'}</p>
        <p className={styles.line}>&gt; network</p>
        <p className={styles.line}>{online ? 'ONLINE' : 'OFFLINE'}</p>
        <p className={styles.line}>
          {locked ? '> login' : '>'} <span className={styles.cursor}>_</span>
        </p>
      </div>
    );
  }

  return (
    <div className={styles.idle}>
      <RetroStatus />
      <div className={styles.idleClock}>
        <DotNumber value={formatTime(now)} size={64} />
        <p className={styles.date}>{dayFormat.format(now).replace(/,/g, '').toUpperCase()}</p>
      </div>
    </div>
  );
}
