import { useEffect, useState } from 'react';
import { DotLogo } from '../../components/DotLogo';
import { hostInfo } from '../../system/nativeBridge';
import { askTool, hasRootTools } from '../../system/rootTools';
import styles from './HackerBoot.module.css';

const LOG_MS = 1300;
const TOTAL_MS = 2300;

/** The boot log's lines, with this phone's real values where they can be read. */
async function bootLines(): Promise<string[]> {
  const lines = ['vantage-os bootloader v1.0', 'mounting /var/jb ........... ok'];
  try {
    const info = await hostInfo();
    if (info) lines.push(`device ${info.model ?? 'iPhone'} · iOS ${info.iosVersion ?? '?'}`);
    if (hasRootTools()) {
      const [uname, stats] = await Promise.all([askTool('run', 'uname'), askTool('run', 'stats')]);
      const kernel = uname.out[0]?.match(/Darwin Kernel Version ([\d.]+)/)?.[1];
      if (kernel) lines.push(`kernel xnu ${kernel}`);
      const s = stats.data as { bootTime?: number; now?: number; interfaces?: Record<string, { ipv4?: string }> } | null;
      if (s?.bootTime && s.now) {
        const up = s.now - s.bootTime;
        lines.push(`uptime ${Math.floor(up / 86400)}d ${Math.floor((up % 86400) / 3600)}h ${Math.floor((up % 3600) / 60)}m`);
      }
      if (s?.interfaces?.en0?.ipv4) lines.push(`net en0 ${s.interfaces.en0.ipv4} ....... up`);
      lines.push('root helper 127.0.0.1:47811 . ok');
    }
    const battery = await (window.vantageNative as { getBattery?: () => Promise<{ level: number; charging: boolean }> } | undefined)?.getBattery?.();
    if (battery) lines.push(`battery ${Math.round(battery.level * 100)}%${battery.charging ? ' charging' : ''}`);
  } catch {
    // the fixed lines are enough
  }
  lines.push('starting shell ............ ok');
  return lines;
}

/** Hacker mode's boot: a fast scrolling boot log, then the dotted V assembles. */
export function HackerBoot({ onDone }: { onDone: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<'log' | 'logo' | 'fade'>('log');
  useEffect(() => {
    void bootLines().then(setLines);
    const timers = [window.setTimeout(() => setPhase('logo'), LOG_MS), window.setTimeout(() => setPhase('fade'), TOTAL_MS), window.setTimeout(onDone, TOTAL_MS + 400)];
    return () => timers.forEach((t) => window.clearTimeout(t));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!lines.length || shown >= lines.length) return;
    const t = window.setTimeout(() => setShown((n) => n + 1), Math.max(40, LOG_MS / (lines.length + 2)));
    return () => window.clearTimeout(t);
  }, [lines, shown]);
  return (
    <div className={`${styles.boot} ${phase === 'fade' ? styles.fading : ''}`} aria-label="Vantage OS is starting">
      {phase === 'log' ? (
        <div className={styles.log}>
          {lines.slice(0, shown).map((line, i) => (
            <div key={i}>
              <span className={styles.stamp}>[{(0.087 * (i + 1)).toFixed(3)}]</span> {line}
            </div>
          ))}
          <span className={styles.cursor} />
        </div>
      ) : (
        <div className={styles.logo}>
          <DotLogo animated dissolve={phase === 'fade'} />
        </div>
      )}
    </div>
  );
}
