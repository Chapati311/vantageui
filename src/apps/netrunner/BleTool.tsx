import { useEffect, useMemo, useState } from 'react';
import { Button, Row, Section } from '../../components/kit';
import { isHosted } from '../../system/nativeBridge';
import styles from './Netrunner.module.css';

export interface BleDevice {
  id: string;
  name?: string;
  rssi: number;
  seen: number;
  maker?: string;
  connectable?: boolean;
}

interface BleBridge {
  bleScan?: (on: boolean) => Promise<string>;
}
const bridge = () => window.vantageNative as BleBridge | undefined;

/** Rough distance from signal strength (1 m reference -59 dBm, indoor path loss 2.5). */
export function distanceOf(rssi: number): number {
  return Math.round(10 ** ((-59 - rssi) / 25) * 10) / 10;
}

/** Live list of nearby Bluetooth LE devices while `on` (passive: only listens to adverts). */
export function useBleScan(on: boolean): { devices: BleDevice[]; state: string } {
  const [devices, setDevices] = useState<Record<string, BleDevice>>({});
  const [state, setState] = useState(isHosted() ? 'off' : 'unsupported');
  useEffect(() => {
    const native = bridge();
    if (!on || !native?.bleScan) return;
    const onEvent = (event: Event) => {
      const list = (event as CustomEvent<BleDevice[]>).detail ?? [];
      setDevices((before) => {
        const next = { ...before };
        list.forEach((d) => (next[d.id] = { ...next[d.id], ...d }));
        return next;
      });
    };
    const onState = (event: Event) => setState(String((event as CustomEvent<string>).detail));
    window.addEventListener('vantage:ble', onEvent);
    window.addEventListener('vantage:ble-state', onState);
    void native.bleScan(true).then(setState).catch((e: Error) => setState(e.message));
    // Gone quiet for 30 s = out of range
    const prune = window.setInterval(() => setDevices((before) => Object.fromEntries(Object.entries(before).filter(([, d]) => Date.now() - d.seen < 30_000))), 5000);
    return () => {
      void native.bleScan?.(false);
      window.removeEventListener('vantage:ble', onEvent);
      window.removeEventListener('vantage:ble-state', onState);
      window.clearInterval(prune);
    };
  }, [on]);
  return { devices: Object.values(devices).sort((a, b) => b.rssi - a.rssi), state };
}

/** 8. Bluetooth radar: nearby devices advertising over Bluetooth LE, as blips by distance. */
export function BleTool() {
  const [on, setOn] = useState(true);
  const { devices, state } = useBleScan(on);
  const [sweep, setSweep] = useState(0);
  useEffect(() => {
    if (!on) return;
    let frame = 0;
    const tick = (t: number) => {
      setSweep((t / 2400) * 360);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [on]);
  const blips = useMemo(
    () =>
      devices.map((d) => {
        const angle = ([...d.id].reduce((s, c) => s + c.charCodeAt(0), 0) % 360) * (Math.PI / 180);
        const r = Math.min(135, 22 + distanceOf(d.rssi) * 14);
        return { d, x: 150 + Math.cos(angle) * r, y: 150 + Math.sin(angle) * r };
      }),
    [devices],
  );

  if (!bridge()?.bleScan) return <p className={styles.note}>Bluetooth radar uses the iPhone's Bluetooth: it runs in the Vantage OS app on the phone.</p>;
  return (
    <>
      <svg className={styles.map} viewBox="0 0 300 300" role="img" aria-label={`Bluetooth radar: ${devices.length} devices`}>
        {[45, 90, 135].map((r, i) => (
          <g key={r}>
            <circle cx="150" cy="150" r={r} fill="none" stroke="var(--color-hairline)" />
            <text x={150 + r - 4} y={146} fontSize="8" textAnchor="end" fill="var(--text-tertiary)" fontFamily="var(--font-mono)">
              {['2 m', '5 m', '9 m'][i]}
            </text>
          </g>
        ))}
        {on && <path d="M150 150 L150 15 A135 135 0 0 1 210 29 Z" fill="rgb(var(--accent-rgb) / 0.18)" transform={`rotate(${sweep} 150 150)`} />}
        <circle cx="150" cy="150" r="4" fill="var(--color-accent)" />
        {blips.map(({ d, x, y }) => (
          <g key={d.id}>
            <circle cx={x} cy={y} r={Math.max(3, Math.min(7, (d.rssi + 100) / 8))} fill="var(--color-accent)" opacity={Math.max(0.35, Math.min(1, (d.rssi + 100) / 50))} />
            {d.name && (
              <text x={x} y={y - 8} fontSize="8" textAnchor="middle" fill="var(--text-secondary)" fontFamily="var(--font-mono)">
                {d.name.slice(0, 14)}
              </text>
            )}
          </g>
        ))}
      </svg>
      <Button wide onPress={() => setOn((o) => !o)}>
        {on ? 'Stop scanning' : 'Scan'}
      </Button>
      <p className={styles.note}>{state === 'on' || state === 'scanning' ? 'Listening to Bluetooth LE adverts nearby (passive: nothing connects).' : `Bluetooth: ${state}`}</p>
      {devices.length > 0 && (
        <Section label={`${devices.length} nearby`}>
          {devices.map((d) => (
            <Row key={d.id} title={d.name ?? d.maker ?? 'Unnamed device'} detail={<span className={styles.mono}>{`${d.rssi} dBm · ~${distanceOf(d.rssi)} m${d.maker && d.name ? ` · ${d.maker}` : ''}`}</span>} />
          ))}
        </Section>
      )}
    </>
  );
}
