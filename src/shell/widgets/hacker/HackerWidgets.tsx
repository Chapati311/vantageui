import { useEffect, useState } from 'react';
import { Widget } from '../../../components/Widget';
import { rate, sparkPath, useLiveStats } from '../../../apps/netrunner/netStats';
import { useBleScan, distanceOf } from '../../../apps/netrunner/BleTool';
import { useControls } from '../../../system/phoneControls';
import { askTool, hasRootTools } from '../../../system/rootTools';
import type { WidgetProps } from '../types';
import styles from './HackerWidgets.module.css';

/*
 * Hacker mode's home widgets (HACKER_MODE.md 1): live numbers from this phone
 * through the root helper. Off the phone they say where they work.
 */

function Offline({ name }: { name: string }) {
  return (
    <div className={styles.box}>
      <span className={styles.label}>{name}</span>
      <span className={styles.dim}>on the jailbroken iPhone</span>
    </div>
  );
}

/** Network status: Wi-Fi name, local IP, public IP, ping. */
export function NetStatusWidget({ size }: WidgetProps) {
  const live = useLiveStats();
  const controls = useControls();
  const [pub, setPub] = useState<string | null>(null);
  const [ping, setPing] = useState<number | null>(null);
  useEffect(() => {
    if (!hasRootTools()) return;
    void askTool('run', 'publicip')
      .then((a) => setPub((JSON.parse(a.out.join('')) as { ip?: string }).ip ?? null))
      .catch(() => {});
    const check = () =>
      void askTool('run', 'latency')
        .then((a) => setPing(Number((a.out[0] ?? '').split(' ')[0]) * 1000 || null))
        .catch(() => setPing(null));
    check();
    const timer = window.setInterval(check, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  if (!hasRootTools()) return <Widget shape="rounded"><Offline name="network" /></Widget>;
  const en0 = live.stats?.interfaces.en0;
  return (
    <Widget shape="rounded">
      <div className={styles.box}>
        <span className={styles.label}>
          <span className={styles.ok} /> {controls.wifi?.on ? controls.wifi.network ?? 'wi-fi' : 'offline'}
        </span>
        <span className={styles.line}>lan {en0?.ipv4 ?? '…'}</span>
        {size !== '2x1' && <span className={styles.line}>wan {pub ?? '…'}</span>}
        <span className={styles.line}>ping {ping ? `${ping.toFixed(0)} ms` : '…'}</span>
      </div>
    </Widget>
  );
}

/** Live traffic: down/up rate and a sparkline of the last two minutes. */
export function TrafficWidget({ size }: WidgetProps) {
  const live = useLiveStats();
  if (!hasRootTools()) return <Widget shape="rounded"><Offline name="traffic" /></Widget>;
  const downs = live.history.map((h) => h.down);
  const ups = live.history.map((h) => h.up);
  const max = Math.max(1, ...downs, ...ups);
  return (
    <Widget shape="rounded">
      <div className={styles.box}>
        <span className={styles.label}>traffic</span>
        <span className={styles.big}>↓ {rate(live.down)}</span>
        <span className={styles.line}>↑ {rate(live.up)}</span>
        {size !== '2x1' && (
          <svg className={styles.spark} viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
            <path d={sparkPath(downs, 100, 40, max)} fill="none" stroke="var(--color-accent)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            <path d={sparkPath(ups, 100, 40, max)} fill="none" stroke="var(--text-secondary)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
      </div>
    </Widget>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const cells = 12;
  const lit = Math.round(Math.min(1, Math.max(0, value)) * cells);
  return (
    <span className={styles.line}>
      {label.padEnd(4)} [{'█'.repeat(lit)}
      <span className={styles.dim}>{'░'.repeat(cells - lit)}</span>] {Math.round(value * 100)}%
    </span>
  );
}

/** System: battery, CPU, RAM bars and uptime, like `top`. */
export function SystemWidget() {
  const live = useLiveStats();
  const [battery, setBattery] = useState<number | null>(null);
  useEffect(() => {
    const native = window.vantageNative as { getBattery?: () => Promise<{ level: number }> } | undefined;
    void native?.getBattery?.().then((b) => setBattery(b.level)).catch(() => {});
  }, []);
  if (!hasRootTools()) return <Widget shape="rounded"><Offline name="system" /></Widget>;
  const m = live.stats?.memory;
  const used = m ? 1 - (m.free + 0) / m.total : 0;
  const up = live.stats ? live.stats.now - live.stats.bootTime : 0;
  return (
    <Widget shape="rounded">
      <div className={styles.box}>
        <span className={styles.label}>system</span>
        <Bar label="cpu" value={live.cpu} />
        <Bar label="ram" value={used} />
        {battery !== null && <Bar label="bat" value={battery} />}
        <span className={styles.line}>up {Math.floor(up / 86400)}d {Math.floor((up % 86400) / 3600)}h {Math.floor((up % 3600) / 60)}m</span>
      </div>
    </Widget>
  );
}

/** Open ports on THIS phone (what it listens on, for the whole network). */
export function PortsWidget() {
  const [ports, setPorts] = useState<{ port: number; process: string; open: boolean }[] | null>(null);
  useEffect(() => {
    if (!hasRootTools()) return;
    const load = () =>
      void askTool('run', 'listening')
        .then((a) => {
          const found: { port: number; process: string; open: boolean }[] = [];
          a.out.forEach((line) => {
            const m = line.match(/^(\S+)\s+\d+\s+\S+.*TCP\s+(\S+):(\d+)\s+\(LISTEN\)/);
            if (m && !found.some((f) => f.port === Number(m[3]))) found.push({ port: Number(m[3]), process: m[1], open: m[2] === '*' });
          });
          setPorts(found.sort((x, y) => x.port - y.port));
        })
        .catch(() => setPorts([]));
    load();
    const timer = window.setInterval(load, 120_000);
    return () => window.clearInterval(timer);
  }, []);
  if (!hasRootTools()) return <Widget shape="rounded"><Offline name="open ports" /></Widget>;
  return (
    <Widget shape="rounded">
      <div className={styles.box}>
        <span className={styles.label}>open ports</span>
        {(ports ?? []).slice(0, 4).map((p) => (
          <span key={p.port} className={styles.line}>
            {String(p.port).padStart(5)} {p.process.slice(0, 9)} <span className={p.open ? styles.warn : styles.dim}>{p.open ? 'net' : 'local'}</span>
          </span>
        ))}
        {ports === null && <span className={styles.dim}>scanning…</span>}
      </div>
    </Widget>
  );
}

/** Devices on my Wi-Fi (from Netrunner's last map scan of this network). */
export function DevicesWidget() {
  const controls = useControls();
  const ssid = controls.wifi?.on ? controls.wifi.network ?? null : null;
  let count = 0;
  let newest = '';
  try {
    const all = JSON.parse(localStorage.getItem('netrunner.devices.v1') ?? '{}') as Record<string, Record<string, { lastSeen: number; firstSeen: number; name?: string; vendor: string }>>;
    const list = Object.values((ssid && all[ssid]) || {});
    count = list.length;
    const latest = list.sort((a, b) => b.firstSeen - a.firstSeen)[0];
    newest = latest ? latest.name ?? latest.vendor : '';
  } catch {
    // nothing scanned yet
  }
  return (
    <Widget shape="rounded">
      <div className={styles.box}>
        <span className={styles.label}>{ssid ?? 'no wi-fi'}</span>
        <span className={styles.big}>{count || '-'}</span>
        <span className={styles.line}>{count ? 'devices on my network' : 'tap to scan'}</span>
        {newest && <span className={styles.dim}>newest: {newest.slice(0, 18)}</span>}
      </div>
    </Widget>
  );
}

/** Bluetooth radar: nearby BLE devices as blips. */
export function RadarWidget() {
  const { devices } = useBleScan(true);
  return (
    <Widget shape="rounded">
      <div className={styles.radarBox}>
        <svg className={styles.radar} viewBox="0 0 100 100" aria-label={`${devices.length} Bluetooth devices nearby`}>
          {[16, 32, 48].map((r) => (
            <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="var(--color-hairline)" />
          ))}
          <path className={styles.sweep} d="M50 50 L50 2 A48 48 0 0 1 84 16 Z" fill="rgb(var(--accent-rgb) / 0.22)" />
          {devices.slice(0, 24).map((d) => {
            const angle = ([...d.id].reduce((s, c) => s + c.charCodeAt(0), 0) % 360) * (Math.PI / 180);
            const r = Math.min(46, 8 + distanceOf(d.rssi) * 4.5);
            return <circle key={d.id} cx={50 + Math.cos(angle) * r} cy={50 + Math.sin(angle) * r} r="2.4" fill="var(--color-accent)" />;
          })}
        </svg>
        <span className={styles.radarCount}>{devices.length}</span>
      </div>
    </Widget>
  );
}
