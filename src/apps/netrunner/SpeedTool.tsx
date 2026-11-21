import { useState } from 'react';
import { Button, Row, Section } from '../../components/kit';
import { askTool, hasRootTools } from '../../system/rootTools';
import styles from './Netrunner.module.css';

interface Result {
  at: number;
  ping: number;
  down: number;
  up: number;
  kind: 'internet' | 'lan';
}

const HISTORY_KEY = 'netrunner.speed.v1';
const loadHistory = (): Result[] => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as Result[];
  } catch {
    return [];
  }
};

const mbps = (bytesPerSecond: number) => (bytesPerSecond * 8) / 1e6;

/** 5. Speed test: internet (Cloudflare's speed servers) and your own network (a file on your laptop). */
export function SpeedTool() {
  const [phase, setPhase] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<Result[]>(loadHistory);
  const [lanUrl, setLanUrl] = useState(() => localStorage.getItem('netrunner.lanUrl') ?? 'http://192.168.1.18:8000/test.bin');
  const [error, setError] = useState<string | null>(null);

  const keep = (r: Result) => {
    const next = [r, ...history].slice(0, 30);
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      // kept until reload
    }
  };

  const internet = async () => {
    setError(null);
    setResult(null);
    try {
      setPhase('Latency');
      const pings: number[] = [];
      for (let i = 0; i < 5; i++) {
        const a = await askTool('run', 'latency');
        const [connect] = (a.out[0] ?? '').split(' ').map(Number);
        if (connect > 0) pings.push(connect * 1000);
      }
      const ping = pings.length ? Math.min(...pings) : 0;
      setPhase('Download');
      const d = await askTool('run', 'download', [25_000_000]);
      const down = mbps(Number((d.out[0] ?? '0').split(' ')[0]));
      setResult({ at: Date.now(), ping, down, up: 0, kind: 'internet' });
      setPhase('Upload');
      const u = await askTool('run', 'upload', [10_000_000]);
      const up = mbps(Number((u.out[0] ?? '0').split(' ')[0]));
      const done: Result = { at: Date.now(), ping, down, up, kind: 'internet' };
      setResult(done);
      keep(done);
    } catch (e) {
      setError((e as Error).message);
    }
    setPhase(null);
  };

  const lan = async () => {
    setError(null);
    setPhase('LAN download');
    try {
      localStorage.setItem('netrunner.lanUrl', lanUrl);
      const d = await askTool('run', 'lanspeed', [lanUrl]);
      const down = mbps(Number((d.out[0] ?? '0').split(' ')[0]));
      if (!down) throw new Error(d.err.join(' ') || 'No answer from that address');
      const done: Result = { at: Date.now(), ping: 0, down, up: 0, kind: 'lan' };
      setResult(done);
      keep(done);
    } catch (e) {
      setError((e as Error).message);
    }
    setPhase(null);
  };

  if (!hasRootTools()) return <p className={styles.note}>The speed test runs from the jailbroken iPhone running Vantage OS.</p>;
  return (
    <>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className="label">Ping</span>
          <span className={styles.statValue}>{result?.ping ? `${result.ping.toFixed(0)} ms` : '…'}</span>
        </div>
        <div className={styles.stat}>
          <span className="label">Down</span>
          <span className={styles.statValue}>{result?.down ? `${result.down.toFixed(1)}` : '…'}</span>
        </div>
        <div className={styles.stat}>
          <span className="label">Up</span>
          <span className={styles.statValue}>{result?.up ? `${result.up.toFixed(1)}` : '…'}</span>
        </div>
      </div>
      <p className={styles.note}>{phase ? `Measuring: ${phase}…` : 'Down and up in megabits per second. The test uses about 35 MB of data.'}</p>
      <Button kind="primary" wide disabled={!!phase} onPress={() => void internet()}>
        {phase ? phase : 'Test my internet'}
      </Button>
      <Section label="My network (LAN)" note="On your laptop, in a folder with a big file: python -m http.server 8000. Then put its address here.">
        <div className={styles.inputRow}>
          <input className={styles.input} value={lanUrl} onChange={(e) => setLanUrl(e.target.value)} aria-label="File on your laptop" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        </div>
      </Section>
      <Button wide disabled={!!phase} onPress={() => void lan()}>
        Test LAN speed
      </Button>
      {error && <p className={`${styles.note} ${styles.bad}`}>{error}</p>}
      {history.length > 0 && (
        <Section label="History">
          {history.map((r) => (
            <Row
              key={r.at}
              title={r.kind === 'lan' ? `LAN ↓ ${r.down.toFixed(1)} Mb/s` : `↓ ${r.down.toFixed(1)}  ↑ ${r.up.toFixed(1)} Mb/s`}
              detail={new Date(r.at).toLocaleString()}
              value={r.ping ? `${r.ping.toFixed(0)} ms` : ''}
            />
          ))}
        </Section>
      )}
    </>
  );
}
