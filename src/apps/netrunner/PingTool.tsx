import { useEffect, useState } from 'react';
import { Button, Row, Section } from '../../components/kit';
import { isPrivateIp, useToolRun } from '../../system/rootTools';
import { sparkPath } from './netStats';
import { Output } from './Output';
import { takeNetrunnerTarget } from './netrunnerNav';
import styles from './Netrunner.module.css';

const QUICK = ['1.1.1.1', '8.8.8.8', 'apple.com', 'google.com'];

interface Hop {
  n: number;
  ip?: string;
  ms?: number;
  place?: string;
}

/** Where an IP address is (city, country, network) - ipinfo.io, asked from this phone. */
const places = new Map<string, Promise<string>>();
function placeOf(ip: string): Promise<string> {
  if (isPrivateIp(ip)) return Promise.resolve('your network / provider (private)');
  if (!places.has(ip))
    places.set(
      ip,
      fetch(`https://ipinfo.io/${ip}/json`)
        .then((r) => r.json() as Promise<{ city?: string; country?: string; org?: string }>)
        .then((j) => [j.city, j.country, j.org?.replace(/^AS\d+\s*/, '')].filter(Boolean).join(', ') || 'unknown')
        .catch(() => 'unknown'),
    );
  return places.get(ip)!;
}

/** 3. Ping & Trace: a live ping graph, and the route to a host hop by hop. */
export function PingTool() {
  const [start] = useState(takeNetrunnerTarget);
  const [host, setHost] = useState(start?.value ?? '1.1.1.1');
  const ping = useToolRun();
  const trace = useToolRun();
  const [hops, setHops] = useState<Hop[]>([]);
  // Opened from Search / Vantage with a host ("ping apple.com", "trace 1.1.1.1"): go
  useEffect(() => {
    if (!start) return;
    if (start.action === 'trace') void trace.start('traceroute', [start.value]);
    else void ping.start('ping', [start.value, 20]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const times = ping.lines.map((l) => l.text.match(/time[=<]([\d.]+) ?ms/)).filter(Boolean).map((m) => Number(m![1]));
  const sent = ping.lines.filter((l) => /bytes from|Request timeout|timeout/i.test(l.text)).length;
  const lost = ping.lines.filter((l) => /Request timeout|timeout/i.test(l.text)).length;
  const summary = ping.lines.find((l) => /packet loss/.test(l.text))?.text;
  const min = times.length ? Math.min(...times) : 0;
  const max = times.length ? Math.max(...times) : 0;
  const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;

  // Traceroute lines: " 3   10.80.129.190  9.347ms" (inetutils)
  useEffect(() => {
    const parsed: Hop[] = [];
    for (const line of trace.lines) {
      const m = line.text.match(/^\s*(\d+)\s+(?:(\d+\.\d+\.\d+\.\d+)\s+([\d.]+)ms|\*)/);
      if (m) parsed.push({ n: Number(m[1]), ip: m[2], ms: m[3] ? Number(m[3]) : undefined });
    }
    setHops((before) => parsed.map((hop) => ({ ...hop, place: before.find((b) => b.n === hop.n && b.ip === hop.ip)?.place })));
    parsed.forEach((hop) => {
      if (!hop.ip) return;
      void placeOf(hop.ip).then((place) => setHops((list) => list.map((h) => (h.n === hop.n && h.ip === hop.ip ? { ...h, place } : h))));
    });
  }, [trace.lines]);

  return (
    <>
      <div className={styles.inputRow}>
        <input className={styles.input} value={host} onChange={(e) => setHost(e.target.value.trim())} aria-label="Host" placeholder="example.com or 1.1.1.1" autoCapitalize="none" autoCorrect="off" spellCheck={false} />
      </div>
      <div className={styles.chips}>
        {QUICK.map((q) => (
          <button key={q} type="button" className={styles.chip} aria-pressed={host === q} onClick={() => setHost(q)}>
            {q}
          </button>
        ))}
      </div>
      <div className={styles.inputRow}>
        <Button kind="primary" wide disabled={!host || ping.running} onPress={() => void ping.start('ping', [host, 20])}>
          Ping
        </Button>
        <Button wide disabled={!host || trace.running} onPress={() => void trace.start('traceroute', [host])}>
          Trace route
        </Button>
      </div>
      {(times.length > 0 || ping.running) && (
        <>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className="label">Average</span>
              <span className={styles.statValue}>{avg ? `${avg.toFixed(1)} ms` : '…'}</span>
            </div>
            <div className={styles.stat}>
              <span className="label">Min / max</span>
              <span className={styles.statValue}>{times.length ? `${min.toFixed(0)}/${max.toFixed(0)}` : '…'}</span>
            </div>
            <div className={styles.stat}>
              <span className="label">Lost</span>
              <span className={`${styles.statValue} ${lost ? styles.warn : ''}`}>{sent ? `${Math.round((lost / sent) * 100)}%` : '…'}</span>
            </div>
          </div>
          <svg className={styles.graph} viewBox="0 0 300 96" preserveAspectRatio="none" aria-label="Ping times">
            <path d={sparkPath(times, 300, 96, Math.max(10, max * 1.2))} fill="none" stroke="var(--color-accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
          {summary && <p className={styles.note}>{summary.trim()}</p>}
        </>
      )}
      {(ping.running || ping.lines.length > 0) && <Output title={`ping ${host}`} lines={ping.lines} running={ping.running} code={ping.code} onStop={ping.stop} />}
      {hops.length > 0 && (
        <Section label={`Route to ${host}: ${hops.length} hop${hops.length === 1 ? '' : 's'}`} note="Each hop is a router your data passes. Places come from ipinfo.io.">
          {hops.map((hop) => (
            <Row key={hop.n} title={`${hop.n}. ${hop.ip ?? 'no answer (*)'}`} detail={hop.ip ? hop.place ?? 'locating…' : 'this router stays silent'} value={hop.ms !== undefined ? `${hop.ms.toFixed(0)} ms` : ''} />
          ))}
        </Section>
      )}
      {(trace.running || trace.lines.length > 0) && <Output title={`traceroute ${host}`} lines={trace.lines} running={trace.running} code={trace.code} onStop={trace.stop} />}
    </>
  );
}
